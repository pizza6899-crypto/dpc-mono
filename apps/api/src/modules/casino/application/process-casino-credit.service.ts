import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma, GameProvider, GameTransactionType, WalletBalanceType, WalletTransactionType } from '@prisma/client';
import { CasinoGameSession } from '../game-session/domain';
import { Transactional } from '@nestjs-cls/transactional';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import { GAME_ROUND_REPOSITORY_TOKEN } from '../ports/out/game-round.repository.token';
import type { GameRoundRepositoryPort } from '../ports/out/game-round.repository.port';
import { GAME_TRANSACTION_REPOSITORY_TOKEN } from '../ports/out/game-transaction.repository.token';
import type { GameTransactionRepositoryPort } from '../ports/out/game-transaction.repository.port';
import { UpdateUserBalanceService } from 'src/modules/wallet/application/update-user-balance.service';
import { UpdateOperation, WalletActionName } from 'src/modules/wallet/domain';
import { GameTransaction } from '../domain/model/game-transaction.entity';
import { CheckCasinoBalanceService } from './check-casino-balance.service';
import { GameRound } from '../domain/model/game-round.entity';
import { CasinoWinMetadata } from 'src/modules/wallet/domain/model/wallet-transaction-metadata';
import { CasinoQueueService } from '../infrastructure/queue/casino-queue.service';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';

export interface ProcessCasinoCreditCommand {
    session: CasinoGameSession;
    amount: Prisma.Decimal;
    transactionId: string;
    roundId: string;
    gameId: bigint;
    winTime: Date;
    provider: GameProvider;
    isCancel?: boolean;
    isJackpot?: boolean;
    isBonus?: boolean;
    isEndRound?: boolean;
    description?: string;
}

export interface ProcessCasinoCreditResult {
    balance: Prisma.Decimal;
}


@Injectable()
export class ProcessCasinoCreditService {
    private readonly logger = new Logger(ProcessCasinoCreditService.name);

    constructor(
        private readonly snowflakeService: SnowflakeService,
        @Inject(GAME_ROUND_REPOSITORY_TOKEN)
        private readonly gameRoundRepository: GameRoundRepositoryPort,
        @Inject(GAME_TRANSACTION_REPOSITORY_TOKEN)
        private readonly gameTransactionRepository: GameTransactionRepositoryPort,
        private readonly updateUserBalanceService: UpdateUserBalanceService,
        private readonly checkCasinoBalanceService: CheckCasinoBalanceService,
        private readonly casinoQueueService: CasinoQueueService,
        private readonly advisoryLockService: AdvisoryLockService,
    ) { }

    @Transactional()
    async execute(command: ProcessCasinoCreditCommand): Promise<ProcessCasinoCreditResult> {
        const { session, amount, transactionId, roundId, gameId, winTime, provider, isCancel, isJackpot, isBonus, description } = command;

        // ... (앞부분 생략: Lock, Resolve Game Round, Idempotency Check) ...

        // 1. Acquire Advisory Lock (Round Level)
        // [FIX] 애그리게이터 타입을 키에 포함하여 서로 다른 애그리게이터 간의 ID 충돌(Lock Collision)을 방지합니다.
        const lockKey = `${session.aggregatorType}:${roundId}`;
        await this.advisoryLockService.acquireLock(LockNamespace.GAME_ROUND, lockKey, {
            throwThrottleError: true,
        });

        // 2. Resolve Game Round
        let round = await this.gameRoundRepository.findByExternalIdWithWindow(
            roundId,
            session.aggregatorType,
            winTime,
        );

        const anchorTime = round ? round.startedAt : winTime;

        if (!round) {
            this.logger.warn(`WIN 요청을 위한 라운드가 존재하지 않음: ${roundId}. 새로운 라운드 생성 시도.`);

            // [FIX] 애그리게이터가 보내는 외부 ID 대신 세션에 기록된 우리 DB의 내부 PK(gameId)를 사용합니다.
            const internalGameId = session.gameId;
            if (!internalGameId) {
                throw new Error(`Casino Game Session has no valid gameId: ${session.id}`);
            }

            const newRoundId = this.snowflakeService.generate(winTime);
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
                winTime,
                true, // isOrphaned: 베팅 없이 당첨/환불/보너스만 들어온 경우
            );
            await this.gameRoundRepository.save(round);
        }

        // 3. Idempotency Check
        let txType: GameTransactionType = GameTransactionType.WIN;
        if (isCancel) txType = GameTransactionType.CANCEL;
        else if (isJackpot) txType = GameTransactionType.JACKPOT;

        const existingTx = await this.gameTransactionRepository.findByExternalId(
            transactionId,
            txType,
            anchorTime,
        );

        if (existingTx) {
            this.logger.warn(`중복된 ${txType} 요청 무시됨: ${transactionId}`);
            const balanceResult = await this.checkCasinoBalanceService.execute(session);
            return {
                balance: balanceResult.balance,
            };
        }

        // [LOGICAL FIX] 취소(CANCEL/REFUND) 요청인 경우 처리
        let finalRefundAmount = amount;
        if (isCancel) {
            const originalBet = await this.gameTransactionRepository.findByExternalId(
                transactionId,
                GameTransactionType.BET,
                anchorTime,
            );

            if (!originalBet) {
                this.logger.warn(`원본 BET을 찾을 수 없는 CANCEL 요청 무시됨 (차감된 적 없음): ${transactionId}`);
                const balanceResult = await this.checkCasinoBalanceService.execute(session);
                return {
                    balance: balanceResult.balance,
                };
            }

            // [FIX] DCS 등에서 취소 금액을 보내주지 않는 경우, DB에 기록된 원본 베팅 금액을 사용합니다.
            if (amount.isZero() && originalBet.gameAmount) {
                finalRefundAmount = originalBet.gameAmount;
            }
        }

        // 4. 지급 처리 (현금 잔액으로 지급)
        const walletAmount = finalRefundAmount.div(session.exchangeRate);
        const newTxId = this.snowflakeService.generate(winTime);

        let actionName: WalletActionName = WalletActionName.CASINO_WIN;
        let walletTxType: WalletTransactionType = WalletTransactionType.WIN;

        if (isCancel) {
            actionName = WalletActionName.CASINO_REFUND;
            walletTxType = WalletTransactionType.REFUND;
        } else if (isJackpot) {
            actionName = WalletActionName.CASINO_JACKPOT;
            walletTxType = WalletTransactionType.WIN;
        } else if (isBonus) {
            actionName = WalletActionName.CASINO_BONUS;
            walletTxType = WalletTransactionType.BONUS_IN;
        }


        const updatedWallet = await this.updateUserBalanceService.updateBalance({
            userId: session.userId,
            currency: session.walletCurrency,
            amount: walletAmount,
            operation: UpdateOperation.ADD,
            balanceType: WalletBalanceType.CASH,
            transactionType: walletTxType,
            referenceId: round.id,
        }, {
            actionName: actionName,
            metadata: {
                roundId: String(round.id),
                gameId: String(gameId),
                aggregatorTxId: transactionId,
                gameTransactionId: String(newTxId),
                description,
                provider,
                isOrphaned: round.isOrphaned,
            } as CasinoWinMetadata,
        });

        // 5. 카지노 엔티티 영속화
        const winTx = GameTransaction.create(
            newTxId,
            round.id,
            round.startedAt,
            session.userId,
            txType,
            transactionId,
            walletAmount,
            finalRefundAmount,
            WalletBalanceType.CASH,
            session.walletCurrency,
            winTime,
        );
        await this.gameTransactionRepository.save(winTx);

        // 6. 라운드 통계 업데이트
        const statsDelta: any = {};
        if (isCancel) {
            statsDelta.refundAmount = walletAmount;
            statsDelta.gameRefundAmount = finalRefundAmount;
        } else if (isJackpot) {
            statsDelta.jackpotAmount = walletAmount;
            statsDelta.gameJackpotAmount = amount;
        } else {
            // General Win & Bonus
            statsDelta.winAmount = walletAmount;
            statsDelta.gameWinAmount = amount;
        }

        await this.gameRoundRepository.increaseStats(round.id, round.startedAt, statsDelta);

        // 7. Round Completion 처리
        if (command.isEndRound) {
            round.complete();
            await this.gameRoundRepository.save(round);
        }

        // [비동기] 8. 큐 처리 (결과 조회 & 후처리)
        // 일반 WIN 또는 CANCEL인 경우 라운드가 종료된 것으로 간주하고 후속 작업을 스케줄링합니다.
        // 잭팟이나 보너스는 라운드 진행 중에 발생할 수도 있으므로 제외할지 정책적 결정 필요 (일단 포함)
        // 여기서는 안전하게 모든 Credit 트랜잭션에 대해 후처리를 트리거하되, 잡 내부에서 완료 여부를 판단할 수도 있음.
        // 하지만 효율성을 위해 WIN인 경우에만 트리거하는 것이 일반적.
        if (txType === GameTransactionType.WIN || txType === GameTransactionType.CANCEL) {
            // 7-1. 게임 결과(URL/Replay) 조회 스케줄링
            await this.casinoQueueService.addGameResultFetchJob({
                gameRoundId: round.id.toString(),
            });

            // 7-2. 게임 후처리 (콤프/롤링 등) 스케줄링
            await this.casinoQueueService.addGamePostProcessJob({
                gameRoundId: round.id.toString(),
            });
        }

        // 8. Return Result
        const balanceInGameCurrency = updatedWallet.totalAvailableBalance.mul(session.exchangeRate);

        return {
            balance: balanceInGameCurrency,
        };
    }
}
