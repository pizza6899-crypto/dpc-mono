import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma, GameProvider, CasinoGameTransactionType, WalletBalanceType, WalletTransactionType } from '@prisma/client';
import { CasinoGameSession } from '../game-session/domain';
import { Transactional } from '@nestjs-cls/transactional';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import { GAME_ROUND_REPOSITORY_TOKEN } from '../ports/out/game-round.repository.token';
import type { GameRoundRepositoryPort } from '../ports/out/game-round.repository.port';
import { GAME_TRANSACTION_REPOSITORY_TOKEN } from '../ports/out/game-transaction.repository.token';
import type { GameTransactionRepositoryPort } from '../ports/out/game-transaction.repository.port';
import { UpdateUserBalanceService } from 'src/modules/wallet/application/update-user-balance.service';
import { GameRound } from '../domain/model/game-round.entity';
import { UpdateOperation, WalletActionName } from 'src/modules/wallet/domain';
import { GameTransaction } from '../domain/model/game-transaction.entity';
import { CheckCasinoBalanceService } from './check-casino-balance.service';
import { BettingPolicy } from '../domain/service/betting-policy.service';
import { FindUserWalletService } from 'src/modules/wallet/application/find-user-wallet.service';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';

export interface ProcessCasinoBetCommand {
    session: CasinoGameSession;
    amount: Prisma.Decimal;
    transactionId: string;
    roundId: string;
    gameId: bigint;
    betTime: Date;
    provider: GameProvider;
    isEndRound?: boolean;
    description?: string;
}

export interface ProcessCasinoBetResult {
    balance: Prisma.Decimal;
}

@Injectable()
export class ProcessCasinoBetService {
    private readonly logger = new Logger(ProcessCasinoBetService.name);

    constructor(
        private readonly snowflakeService: SnowflakeService,
        @Inject(GAME_ROUND_REPOSITORY_TOKEN)
        private readonly gameRoundRepository: GameRoundRepositoryPort,
        @Inject(GAME_TRANSACTION_REPOSITORY_TOKEN)
        private readonly gameTransactionRepository: GameTransactionRepositoryPort,
        private readonly updateUserBalanceService: UpdateUserBalanceService,
        private readonly checkCasinoBalanceService: CheckCasinoBalanceService,
        private readonly findUserWalletService: FindUserWalletService,
        private readonly advisoryLockService: AdvisoryLockService,
    ) { }

    @Transactional()
    async execute(command: ProcessCasinoBetCommand): Promise<ProcessCasinoBetResult> {
        const { session, amount, transactionId, roundId, gameId, betTime, description, provider } = command;

        // 1. Acquire Advisory Lock (Round Level)
        // Serialize requests for the same round to prevent race conditions during round creation and idempotency checks.
        // [FIX] 애그리게이터 타입을 키에 포함하여 서로 다른 애그리게이터 간의 ID 충돌(Lock Collision)을 방지합니다.
        const lockKey = `${session.aggregatorType}:${roundId}`;
        await this.advisoryLockService.acquireLock(LockNamespace.GAME_ROUND, lockKey, {
            throwThrottleError: true,
        });

        // 2. Resolve Game Round
        // Find existing round within a 24-hour window or create a new one.
        // This 'anchorTime' (round.startedAt) will be used as the partition key for all related transactions,
        // ensuring idempotency even if the aggregator sends a different betTime during retries.
        let round = await this.gameRoundRepository.findByExternalIdWithWindow(
            roundId,
            session.aggregatorType,
            betTime,
        );

        const anchorTime = round ? round.startedAt : betTime;
        let isNewRound = false;

        if (!round) {
            // [FIX] 애그리게이터가 보내는 외부 ID 대신 세션에 기록된 우리 DB의 내부 PK(gameId)를 사용합니다.
            // 라이브 카지노 등에서 방 이동 시에도 세션 정보를 기준으로 무결성을 유지합니다.
            const internalGameId = session.gameId;
            if (!internalGameId) {
                throw new Error(`Casino Game Session has no valid gameId: ${session.id}`);
            }

            // Use betTime for Snowflake ID generation timestamp
            const newRoundId = this.snowflakeService.generate(betTime);
            round = GameRound.create(
                newRoundId,
                session.userId,
                session.id!,
                internalGameId,
                provider,
                session.aggregatorType,
                roundId,
                session.walletCurrency,
                session.gameCurrency,
                session.exchangeRate,
                session.usdExchangeRate,
                session.compRate,
                betTime,
            );
            isNewRound = true;

            // [FIX] 새로운 라운드인 경우, 트랜잭션 저장을 위해 라운드를 먼저 DB에 생성합니다 (외래키 제약 준수)
            // 통계 정보는 초기값(0)인 상태로 먼저 저장됩니다.
            await this.gameRoundRepository.save(round);
        }

        // 3. Idempotency Check
        // Check if the transaction with the given external ID already exists using the anchorTime.
        const existingTx = await this.gameTransactionRepository.findByExternalId(
            transactionId,
            CasinoGameTransactionType.BET,
            anchorTime,
        );

        if (existingTx) {
            this.logger.warn(`중복된 베팅 요청 무시됨: ${transactionId}`);
            const balanceResult = await this.checkCasinoBalanceService.execute(session);
            return {
                balance: balanceResult.balance,
            };
        }

        // 4. 차감 금액 계산 (믹스벳 정책 적용)
        // 유저 지갑 잔액을 조회하여 현금(Cash)과 보너스(Bonus) 차감 비율을 결정합니다.
        const userWallet = await this.findUserWalletService.findWallet(session.userId, session.walletCurrency, false);
        if (!userWallet) {
            // 세션은 존재하는데 지갑이 없는 경우 (방어 코드)
            throw new Error(`User wallet not found: ${session.userId}, ${session.walletCurrency}`);
        }

        const walletAmount = amount.div(session.exchangeRate);
        const { cashDeduction, bonusDeduction, cashGameAmount, bonusGameAmount } = BettingPolicy.calculateBalanceSplit(
            walletAmount,
            { cash: userWallet.cash, bonus: userWallet.bonus },
            session.exchangeRate
        );

        // 5. 유저 지갑 업데이트 및 트랜잭션 기록
        // 현금과 보너스를 필요에 따라 분리하여 차감합니다.
        let newCashTxId: bigint | undefined;
        let newBonusTxId: bigint | undefined;
        let updatedWallet = userWallet;

        // 5-1. 현금(Cash) 차감
        if (cashDeduction.gt(0)) {
            newCashTxId = this.snowflakeService.generate(betTime);
            updatedWallet = await this.updateUserBalanceService.updateBalance({
                userId: session.userId,
                currency: session.walletCurrency,
                amount: cashDeduction,
                operation: UpdateOperation.SUBTRACT,
                balanceType: WalletBalanceType.CASH,
                transactionType: WalletTransactionType.BET,
                referenceId: round.id, // [변경] 지갑 내역 그룹핑을 위해 Round ID 사용
            }, {
                actionName: WalletActionName.CASINO_BET,
                metadata: {
                    roundId: String(round.id),
                    gameId: String(gameId),
                    aggregatorTxId: transactionId,
                    gameTransactionId: String(newCashTxId), // [추가] 상세 추적용
                    description,
                    provider,
                    splitType: 'CASH',
                },
            });
        }

        // 5-2. 보너스(Bonus) 차감
        if (bonusDeduction.gt(0)) {
            newBonusTxId = this.snowflakeService.generate(betTime); // 별도 ID 생성
            updatedWallet = await this.updateUserBalanceService.updateBalance({
                userId: session.userId,
                currency: session.walletCurrency,
                amount: bonusDeduction,
                operation: UpdateOperation.SUBTRACT,
                balanceType: WalletBalanceType.BONUS,
                transactionType: WalletTransactionType.BET,
                referenceId: round.id, // [변경] 지갑 내역 그룹핑을 위해 Round ID 사용
            }, {
                actionName: WalletActionName.CASINO_BET,
                metadata: {
                    roundId: String(round.id),
                    gameId: String(gameId),
                    aggregatorTxId: transactionId,
                    gameTransactionId: String(newBonusTxId), // [추가] 상세 추적용
                    description,
                    provider,
                    splitType: 'BONUS',
                },
            });
        }

        // 6. 카지노 엔티티 영속화 (GameTransaction & 라운드 통계)
        const totalWalletAmount = cashDeduction.add(bonusDeduction);

        // 6-1. 게임 트랜잭션 저장 (1개 또는 2개)
        if (cashDeduction.gt(0) && newCashTxId) {
            const cashTx = GameTransaction.create(
                newCashTxId,
                round.id,
                round.startedAt,
                session.userId,
                CasinoGameTransactionType.BET,
                transactionId, // 외부 ID 유지
                cashDeduction,
                userWallet.cash,
                // 믹스벳의 경우 게임 금액(Game Amount)도 정책에서 계산된 값 사용
                cashGameAmount,
                WalletBalanceType.CASH,
                session.walletCurrency,
                betTime,
            );
            await this.gameTransactionRepository.save(cashTx);
        }

        if (bonusDeduction.gt(0) && newBonusTxId) {
            const bonusTx = GameTransaction.create(
                newBonusTxId,
                round.id,
                round.startedAt,
                session.userId,
                CasinoGameTransactionType.BET,
                `${transactionId}_BONUS`, // [수정] 생성 시점에 가공된 ID 전달 (유니크 충돌 방지)
                bonusDeduction,
                userWallet.bonus,
                bonusGameAmount,
                WalletBalanceType.BONUS,
                session.walletCurrency,
                betTime,
            );

            await this.gameTransactionRepository.save(bonusTx);
        }

        await this.gameRoundRepository.increaseStats(round.id, round.startedAt, {
            betAmount: totalWalletAmount,
            gameBetAmount: amount,
        });

        // 7. Round Completion 처리
        if (command.isEndRound) {
            round.complete();
            await this.gameRoundRepository.save(round);
        }

        // 8. Return Result (Total Available Balance in Game Currency)
        const balanceInGameCurrency = updatedWallet.totalAvailableBalance.mul(session.exchangeRate);

        return {
            balance: balanceInGameCurrency,
        };
    }
}
