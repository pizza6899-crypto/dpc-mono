import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { GameAggregatorType, Prisma, CasinoGameTransactionType, WalletTransactionType, WalletBalanceType } from '@prisma/client';
import { CasinoErrorCode } from '../constants/casino-error-codes';
import { CasinoGameRoundException } from '../domain/casino.exception';
import { GameResultMeta } from '../domain/model/game-round.entity';
import { GAME_ROUND_REPOSITORY_TOKEN } from '../ports/out/game-round.repository.token';
import type { GameRoundRepositoryPort } from '../ports/out/game-round.repository.port';
import { GAME_TRANSACTION_REPOSITORY_TOKEN } from '../ports/out/game-transaction.repository.token';
import type { GameTransactionRepositoryPort } from '../ports/out/game-transaction.repository.port';
import { UpdateUserBalanceService } from '../../wallet/application/update-user-balance.service';
import { UpdateOperation } from '../../wallet/domain';
import { CasinoRefundMetadata } from '../../wallet/domain/model/wallet-transaction-metadata';

export type GamePushedBetUpdateDto = {
    aggregatorRoundId: string;
    pushedAmountGame: Prisma.Decimal;
    tieAmountGame?: Prisma.Decimal;
};

@Injectable()
export class UpdatePushedBetService {
    private readonly logger = new Logger(UpdatePushedBetService.name);

    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
        @Inject(GAME_ROUND_REPOSITORY_TOKEN)
        private readonly gameRoundRepository: GameRoundRepositoryPort,
        @Inject(GAME_TRANSACTION_REPOSITORY_TOKEN)
        private readonly gameTransactionRepository: GameTransactionRepositoryPort,
        private readonly updateUserBalanceService: UpdateUserBalanceService,
    ) { }

    /**
     * 게임 라운드의 푸시(환불) 및 타이(무승부) 베팅 금액을 업데이트합니다.
     * 1. 믹스벳(캐시+보너스)일 경우 보너스 우선 환불 원칙을 따릅니다.
     * 2. 유저 지갑 잔액을 반환 및 관련 트랜잭션을 기록합니다.
     * 3. 롤링 집계에서 제외하기 위해 UserBalanceStats.totalBet을 차감합니다.
     */
    async execute(dto: GamePushedBetUpdateDto): Promise<{ success: boolean; roundId?: string }> {
        const { aggregatorRoundId, pushedAmountGame, tieAmountGame } = dto;
        const pushVal = pushedAmountGame;
        const tieVal = tieAmountGame ?? new Prisma.Decimal(0);
        const totalPushGame = pushVal.add(tieVal);

        if (totalPushGame.lte(0)) {
            return { success: true };
        }

        // 1. 라운드 조회 (Domain Entity)
        const gameRound = await this.gameRoundRepository.findLatestByExternalId(
            aggregatorRoundId,
            GameAggregatorType.WHITECLIFF,
        );

        if (!gameRound) {
            this.logger.warn(`Pushed bet update skipped: Round not found for ${aggregatorRoundId}`);
            return { success: false };
        }

        // 2. 이미 처리된 라운드인지 확인 (멱등성 보장)
        // Domain Entity 필드 사용
        const isProcessed = gameRound.totalGameRefundAmount && gameRound.totalGameRefundAmount.gte(totalPushGame);
        if (isProcessed) {
            this.logger.debug(`Pushed bet update skipped: Already processed for ${aggregatorRoundId}`);
            return { success: true, roundId: gameRound.id.toString() };
        }

        // 3. 베팅 트랜잭션 조회
        const transactions = await this.gameTransactionRepository.findAllByRoundId(gameRound.id, gameRound.startedAt);
        const betTransactions = transactions.filter(t => t.type === CasinoGameTransactionType.BET);

        // 4. 베팅 원금 분석 (Cash vs Bonus)
        let totalCashBetGame = new Prisma.Decimal(0);
        let totalBonusBetGame = new Prisma.Decimal(0);

        if (betTransactions.length > 0) {
            for (const tx of betTransactions) {
                const amount = tx.gameAmount ?? new Prisma.Decimal(0);
                if (tx.balanceType === WalletBalanceType.CASH) {
                    totalCashBetGame = totalCashBetGame.add(amount);
                } else if (tx.balanceType === WalletBalanceType.BONUS) {
                    totalBonusBetGame = totalBonusBetGame.add(amount);
                }
            }
        }

        // 5. 환불 금액 배분 (보너스 우선 환불)
        let refundBonusGame = new Prisma.Decimal(0);
        let refundCashGame = new Prisma.Decimal(0);

        if (totalPushGame.lte(totalBonusBetGame)) {
            refundBonusGame = totalPushGame;
        } else {
            refundBonusGame = totalBonusBetGame;
            refundCashGame = totalPushGame.minus(totalBonusBetGame);
        }

        // Wallet Currency 환산
        const exchangeRate = gameRound.exchangeRate;
        const refundBonusWallet = refundBonusGame.mul(exchangeRate);
        const refundCashWallet = refundCashGame.mul(exchangeRate);
        const totalRefundWallet = refundBonusWallet.add(refundCashWallet);

        // 롤링 차감용 (Push 금액만 취소 처리)
        const pushAmountWallet = pushVal.mul(exchangeRate);

        try {
            // 6. 지갑 업데이트 (Via Wallet Service)

            // A. Cash Refund
            if (refundCashWallet.gt(0)) {
                await this.updateUserBalanceService.updateBalance({
                    userId: gameRound.userId,
                    currency: gameRound.currency,
                    amount: refundCashWallet,
                    operation: UpdateOperation.ADD,
                    balanceType: WalletBalanceType.CASH,
                    transactionType: WalletTransactionType.REFUND,
                    referenceId: gameRound.id,
                }, {
                    metadata: {
                        roundId: gameRound.id.toString(),
                        reason: 'PUSH_OR_TIE_REFUND_CASH',
                        aggregatorRoundId,
                    } as CasinoRefundMetadata
                });
            }

            // B. Bonus Refund
            if (refundBonusWallet.gt(0)) {
                await this.updateUserBalanceService.updateBalance({
                    userId: gameRound.userId,
                    currency: gameRound.currency,
                    amount: refundBonusWallet,
                    operation: UpdateOperation.ADD,
                    balanceType: WalletBalanceType.BONUS,
                    transactionType: WalletTransactionType.REFUND,
                    referenceId: gameRound.id,
                }, {
                    metadata: {
                        roundId: gameRound.id.toString(),
                        reason: 'PUSH_OR_TIE_REFUND_BONUS',
                        aggregatorRoundId,
                    } as CasinoRefundMetadata
                });
            }

            // C. Update UserBalanceStats (Decrease Total Bet for Rolling exclusion)
            // TODO: UserBalanceStatsService/Repo 도입 필요. 현재는 직접 Prisma 사용.
            if (pushAmountWallet.gt(0)) {
                await this.tx.userBalanceStats.update({
                    where: {
                        userId_currency: {
                            userId: gameRound.userId,
                            currency: gameRound.currency,
                        },
                    },
                    data: {
                        totalBet: { decrement: pushAmountWallet },
                    },
                });
            }

            // D. CasinoGameRound Update (Via Repo)
            // 통계 증가 (환불액)
            await this.gameRoundRepository.increaseStats(gameRound.id, gameRound.startedAt, {
                refundAmount: totalRefundWallet,
                gameRefundAmount: totalPushGame,
            });

            // 메타데이터 업데이트
            const currentMeta = (gameRound.resultMeta as Record<string, any>) || {};
            const newMeta: GameResultMeta = {
                ...currentMeta,
                whitecliffPushInfo: {
                    pushedAmount: pushVal.toNumber(),
                    tieAmount: tieVal.toNumber(),
                    processedAt: new Date().toISOString(),
                },
            };

            await this.gameRoundRepository.updateResultMeta(gameRound.id, gameRound.startedAt, newMeta);

            // Mark as checked using Repository
            await this.gameRoundRepository.markPushedBetChecked([{
                id: gameRound.id,
                startedAt: gameRound.startedAt,
            }]);

            this.logger.log(`Pushed bet updated: Round ${gameRound.id}, GameAmount ${totalPushGame}, WalletAmount ${totalRefundWallet}`);
            return { success: true, roundId: gameRound.id.toString() };

        } catch (error) {
            this.logger.error(`Failed to update pushed bet for round ${gameRound.id}`, error.stack);
            throw new CasinoGameRoundException(
                CasinoErrorCode.INTERNAL_ERROR,
                `Failed to update pushed bet: ${error.message}`
            );
        }
    }

    /**
     * 해당 라운드들이 "푸시 없음(No Push)"임을 검증 완료 처리합니다.
     */
    async markAsChecked(roundIds: { id: bigint; startedAt: Date }[]): Promise<void> {
        if (roundIds.length === 0) return;

        try {
            await this.gameRoundRepository.markPushedBetChecked(roundIds);
        } catch (error) {
            this.logger.error(`Failed to mark rounds as checked`, error.stack);
            throw error;
        }
    }
}
