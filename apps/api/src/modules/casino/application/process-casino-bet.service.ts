import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma, GameProvider, CasinoGameTransactionType, UserWalletBalanceType, UserWalletTransactionType } from '@prisma/client';
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
        const lockKey = `${session.aggregatorType}:${roundId}`;
        await this.advisoryLockService.acquireLock(LockNamespace.GAME_ROUND, lockKey, {
            throwThrottleError: true,
        });

        // 2. Resolve Game Round
        // Find existing round within a 24-hour window or create a new one.
        let round = await this.gameRoundRepository.findByExternalIdWithWindow(
            roundId,
            session.aggregatorType,
            betTime,
        );

        const anchorTime = round ? round.startedAt : betTime;

        if (!round) {
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

            // [FIX] 새로운 라운드인 경우, 트랜잭션 저장을 위해 라운드를 먼저 DB에 생성합니다 (외래키 제약 준수)
            await this.gameRoundRepository.save(round);
        }

        // 3. Idempotency Check
        const existingTx = await this.gameTransactionRepository.findByExternalId(
            transactionId,
            CasinoGameTransactionType.BET,
            anchorTime,
        );

        if (existingTx) {
            this.logger.warn(`[ProcessCasinoBet] 중복된 베팅 요청 (Idempotency): ExternalTxId=${transactionId}`);
            // 재요청 시 현재 잔액 조회 후 반환
            const balanceResult = await this.checkCasinoBalanceService.execute(session);
            return {
                balance: balanceResult.balance,
            };
        }

        // 4. 차감 금액 계산 (믹스벳 정책 적용)
        const userWallet = await this.findUserWalletService.findWallet(session.userId, session.walletCurrency, false);
        if (!userWallet) {
            throw new Error(`User wallet not found: ${session.userId}, ${session.walletCurrency}`);
        }

        const walletAmount = amount.div(session.exchangeRate);
        const { cashDeduction, bonusDeduction, cashGameAmount, bonusGameAmount } = BettingPolicy.calculateBalanceSplit(
            walletAmount,
            { cash: userWallet.cash, bonus: userWallet.bonus },
            session.exchangeRate
        );

        // 5. 유저 지갑 업데이트 및 트랜잭션 기록
        let newCashTxId: bigint | undefined;
        let newBonusTxId: bigint | undefined;
        let updatedWallet = userWallet;

        // 5-1. 현금(Cash) 차감
        if (cashDeduction.gt(0)) {
            newCashTxId = this.snowflakeService.generate(betTime);

            // USD 환산 금액 계산 (Session 스냅샷 환율 기준)
            const cashDeductionUsd = session.walletCurrency === 'USD'
                ? cashDeduction
                : (session.usdExchangeRate && !session.usdExchangeRate.isZero() ? cashDeduction.mul(session.usdExchangeRate) : undefined);

            updatedWallet = await this.updateUserBalanceService.updateBalance({
                userId: session.userId,
                currency: session.walletCurrency,
                amount: cashDeduction,
                amountUsd: cashDeductionUsd, // [Inject] USD Amount
                operation: UpdateOperation.SUBTRACT,
                balanceType: UserWalletBalanceType.CASH,
                transactionType: UserWalletTransactionType.BET,
                referenceId: round.id,
            }, {
                actionName: WalletActionName.CASINO_BET,
                metadata: {
                    roundId: String(round.id),
                    gameId: String(gameId),
                    aggregatorTxId: transactionId,
                    gameTransactionId: String(newCashTxId),
                    description,
                    provider,
                    splitType: 'CASH',
                },
            });
        }

        // 5-2. 보너스(Bonus) 차감
        if (bonusDeduction.gt(0)) {
            newBonusTxId = this.snowflakeService.generate(betTime);
            const bonusDeductionUsd = session.walletCurrency === 'USD'
                ? bonusDeduction
                : (session.usdExchangeRate && !session.usdExchangeRate.isZero() ? bonusDeduction.mul(session.usdExchangeRate) : undefined);

            updatedWallet = await this.updateUserBalanceService.updateBalance({
                userId: session.userId,
                currency: session.walletCurrency,
                amount: bonusDeduction,
                amountUsd: bonusDeductionUsd, // [Inject] USD Amount
                operation: UpdateOperation.SUBTRACT,
                balanceType: UserWalletBalanceType.BONUS,
                transactionType: UserWalletTransactionType.BET,
                referenceId: round.id,
            }, {
                actionName: WalletActionName.CASINO_BET,
                metadata: {
                    roundId: String(round.id),
                    gameId: String(gameId),
                    aggregatorTxId: transactionId,
                    gameTransactionId: String(newBonusTxId),
                    description,
                    provider,
                    splitType: 'BONUS',
                },
            });
        }

        // 6. 카지노 엔티티 영속화 (GameTransaction & 라운드 통계)
        // 6-1. 현금 트랜잭션 저장
        if (cashDeduction.gt(0) && newCashTxId) {
            const cashTx = GameTransaction.create(
                newCashTxId,
                round.id,
                round.startedAt,
                session.userId,
                CasinoGameTransactionType.BET,
                transactionId,
                cashDeduction,
                userWallet.cash,
                cashGameAmount,
                UserWalletBalanceType.CASH,
                session.walletCurrency,
                betTime,
            );
            await this.gameTransactionRepository.save(cashTx);
        }

        // 6-2. 보너스 트랜잭션 저장
        if (bonusDeduction.gt(0) && newBonusTxId) {
            const bonusTx = GameTransaction.create(
                newBonusTxId,
                round.id,
                round.startedAt,
                session.userId,
                CasinoGameTransactionType.BET,
                `${transactionId}_BONUS`,
                bonusDeduction,
                userWallet.bonus,
                bonusGameAmount,
                UserWalletBalanceType.BONUS,
                session.walletCurrency,
                betTime,
            );
            await this.gameTransactionRepository.save(bonusTx);
        }

        // 6-3. 라운드 통계 업데이트
        const totalWalletAmount = cashDeduction.add(bonusDeduction);
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
