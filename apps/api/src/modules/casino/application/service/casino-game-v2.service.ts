import { Injectable, Logger, Inject } from '@nestjs/common';
import { GameRound } from '../../domain/model/game-round.entity';
import { GameTransaction } from '../../domain/model/game-transaction.entity';
import type { GameRoundRepositoryPort } from '../../ports/out/game-round.repository.port';
import { GAME_ROUND_REPOSITORY_TOKEN } from '../../ports/out/game-round.repository.token';
import type { GameTransactionRepositoryPort } from '../../ports/out/game-transaction.repository.port';
import { GAME_TRANSACTION_REPOSITORY_TOKEN } from '../../ports/out/game-transaction.repository.token';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import { GameAggregatorType, GameProvider, GameTransactionType, WalletBalanceType, Prisma, ExchangeCurrencyCode, WalletTransactionType } from '@prisma/client';
import { UpdateUserBalanceService } from 'src/modules/wallet/application/update-user-balance.service';
import { UpdateOperation } from 'src/modules/wallet/domain/wallet.constant';
import { Transactional } from '@nestjs-cls/transactional';

export interface GetOrCreateRoundParams {
    userId: bigint;
    gameSessionId: bigint;
    gameId: bigint;
    provider: GameProvider;
    aggregatorType: GameAggregatorType;
    aggregatorRoundId: string;
    currency: ExchangeCurrencyCode;
    gameCurrency: ExchangeCurrencyCode;
    exchangeRate: Prisma.Decimal;
    startedAt: Date;
}

export interface CreateTransactionParams {
    gameRound: GameRound;
    aggregatorTxId: string;
    type: GameTransactionType;
    amount: Prisma.Decimal;
    gameAmount: Prisma.Decimal | null;
    balanceType: WalletBalanceType;
    createdAt?: Date;
}

@Injectable()
export class CasinoGameV2Service {
    private readonly logger = new Logger(CasinoGameV2Service.name);

    constructor(
        @Inject(GAME_ROUND_REPOSITORY_TOKEN)
        private readonly gameRoundRepository: GameRoundRepositoryPort,
        @Inject(GAME_TRANSACTION_REPOSITORY_TOKEN)
        private readonly gameTransactionRepository: GameTransactionRepositoryPort,
        private readonly snowflakeService: SnowflakeService,
        private readonly walletService: UpdateUserBalanceService,
    ) { }

    async getOrCreateRound(params: GetOrCreateRoundParams): Promise<GameRound> {
        let round = await this.gameRoundRepository.findByExternalId(
            params.aggregatorRoundId,
            params.aggregatorType,
            params.startedAt,
        );

        if (!round) {
            const id = this.snowflakeService.generate(params.startedAt.getTime());
            const newRound = GameRound.create(
                id,
                params.userId,
                params.gameSessionId,
                params.gameId,
                params.provider,
                params.aggregatorType,
                params.aggregatorRoundId,
                params.currency,
                params.gameCurrency,
                params.exchangeRate,
                params.startedAt,
            );
            round = await this.gameRoundRepository.save(newRound);
            this.logger.log(`Created new GameRoundV2: ${round.id} (External: ${params.aggregatorRoundId})`);
        }

        return round;
    }

    @Transactional()
    async createTransaction(params: CreateTransactionParams): Promise<GameTransaction> {
        // 1. Check for existing transaction (Idempotency)
        const existingTx = await this.gameTransactionRepository.findByExternalId(
            params.aggregatorTxId,
            params.type,
            params.gameRound.startedAt,
        );

        if (existingTx) {
            this.logger.warn(`Transaction already exists: ${params.aggregatorTxId} (${params.type})`);
            return existingTx;
        }

        // 2. Prepare Game Transaction
        const createdAt = params.createdAt || new Date();
        const id = this.snowflakeService.generate(createdAt.getTime());

        const transaction = GameTransaction.create(
            id,
            params.gameRound.id,
            params.gameRound.startedAt,
            params.gameRound.userId,
            params.type,
            params.aggregatorTxId,
            params.amount,
            params.gameAmount,
            params.balanceType,
            params.gameRound.currency,
            createdAt,
        );

        // 3. Save Game Transaction (V2 Log)
        const savedTx = await this.gameTransactionRepository.save(transaction);

        // 4. Update Game Round Statistics
        await this.updateRoundStats(params.gameRound, savedTx);

        // 5. Update Wallet Balance
        const walletOp = this.mapToWalletOperation(params.type);
        const walletTxType = this.mapToWalletTransactionType(params.type);

        await this.walletService.updateBalance({
            userId: params.gameRound.userId,
            currency: params.gameRound.currency,
            amount: params.amount,
            operation: walletOp,
            balanceType: params.balanceType,
            transactionType: walletTxType,
            referenceId: savedTx.id,
        }, {
            serviceName: 'CasinoGameV2Service',
            actionName: this.mapToWalletAction(params.type),
            metadata: {
                gameRoundId: params.gameRound.id.toString(),
                aggregatorTxId: params.aggregatorTxId,
                provider: params.gameRound.provider,
            },
        });

        return savedTx;
    }

    private mapToWalletOperation(type: GameTransactionType): UpdateOperation {
        switch (type) {
            case GameTransactionType.BET:
                return UpdateOperation.SUBTRACT;
            case GameTransactionType.WIN:
            case GameTransactionType.JACKPOT:
            case GameTransactionType.CANCEL: // Assuming cancel returns funds
            case GameTransactionType.ROLLBACK:
                return UpdateOperation.ADD;
            default:
                throw new Error(`Unsupported transaction type: ${type}`);
        }
    }

    private mapToWalletTransactionType(type: GameTransactionType): WalletTransactionType {
        switch (type) {
            case GameTransactionType.BET:
                return WalletTransactionType.BET;
            case GameTransactionType.WIN:
            case GameTransactionType.JACKPOT:
                return WalletTransactionType.WIN;
            case GameTransactionType.CANCEL:
            case GameTransactionType.ROLLBACK:
                return WalletTransactionType.REFUND;
            default:
                return WalletTransactionType.ADJUSTMENT;
        }
    }

    private mapToWalletAction(type: GameTransactionType): any {
        // This should map to WalletActionName enum values string
        switch (type) {
            case GameTransactionType.BET: return 'CASINO_BET';
            case GameTransactionType.WIN: return 'CASINO_WIN';
            case GameTransactionType.JACKPOT: return 'CASINO_WIN';
            case GameTransactionType.CANCEL: return 'CASINO_REFUND';
            case GameTransactionType.ROLLBACK: return 'CASINO_REFUND';
            default: return 'SYSTEM_ADJUSTMENT';
        }
    }

    private async updateRoundStats(round: GameRound, transaction: GameTransaction): Promise<void> {
        const stats: any = {};

        if (transaction.type === GameTransactionType.BET) {
            round.totalBetAmount = round.totalBetAmount.add(transaction.amount);
            if (transaction.gameAmount) {
                round.totalGameBetAmount = round.totalGameBetAmount.add(transaction.gameAmount);
            }
            stats.totalBetAmount = round.totalBetAmount;
            stats.totalGameBetAmount = round.totalGameBetAmount;
        } else if (transaction.type === GameTransactionType.WIN || transaction.type === GameTransactionType.JACKPOT) {
            round.totalWinAmount = round.totalWinAmount.add(transaction.amount);
            if (transaction.gameAmount) {
                round.totalGameWinAmount = round.totalGameWinAmount.add(transaction.gameAmount);
            }
            stats.totalWinAmount = round.totalWinAmount;
            stats.totalGameWinAmount = round.totalGameWinAmount;
        } else if (transaction.type === GameTransactionType.CANCEL || transaction.type === GameTransactionType.ROLLBACK) {
            // How to handle cancel? It depends on what's being cancelled.
            // For now, let's assume we subtract from the respective totals if we know the original type.
            // But usually, CANCEL is a separate transaction.
            // In V2, we might need to know the original transaction to properly subtract.
            // To keep it simple for now, we just log it. 
            // Better logic would be required for accurate rolling totals if cancels are frequent.
        }

        if (Object.keys(stats).length > 0) {
            await this.gameRoundRepository.updateStats(round.id, round.startedAt, stats);
        }
    }

    async completeRound(id: bigint, startedAt: Date): Promise<void> {
        const round = await this.gameRoundRepository.findById(id, startedAt);
        if (round && !round.isCompleted) {
            round.complete();
            await this.gameRoundRepository.save(round);
        }
    }
}
