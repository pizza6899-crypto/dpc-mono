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
import { FindUserWalletService } from 'src/modules/wallet/application/find-user-wallet.service';
import { CasinoErrorCode } from '../../constants/casino-error-codes';
import { BettingPolicy } from '../../domain/service/betting-policy.service';

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

export interface ProcessGameActionCommand {
    user: {
        id: bigint;
    };
    game: {
        id: bigint;
        sessionId: bigint;
        provider: GameProvider;
        aggregatorType: GameAggregatorType;
    };
    round: {
        externalId: string; // aggregatorRoundId
        startedAt: Date;
    };
    transaction: {
        type: GameTransactionType;
        externalId: string; // aggregatorTxId
        amount: Prisma.Decimal; // Wallet Currency Amount
        gameAmount: Prisma.Decimal; // Game Currency Amount
        occurredAt: Date;
    };
    currency: {
        wallet: ExchangeCurrencyCode;
        game: ExchangeCurrencyCode;
        exchangeRate: Prisma.Decimal;
    };
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
        private readonly findUserWalletService: FindUserWalletService,
    ) { }

    /**
     * 표준화된 게임 액션 처리 (Bet, Win 등)
     * 특히 BET의 경우 Cash/Bonus 분할 사용 처리를 포함합니다.
     */
    @Transactional()
    async processGameAction(command: ProcessGameActionCommand): Promise<GameTransaction> {
        // 1. Get or Create Game Round
        const round = await this.getOrCreateRound({
            userId: command.user.id,
            gameSessionId: command.game.sessionId,
            gameId: command.game.id,
            provider: command.game.provider,
            aggregatorType: command.game.aggregatorType,
            aggregatorRoundId: command.round.externalId,
            currency: command.currency.wallet,
            gameCurrency: command.currency.game,
            exchangeRate: command.currency.exchangeRate,
            startedAt: command.round.startedAt,
        });

        // 2. Logic Branch based on Type
        if (command.transaction.type === GameTransactionType.BET) {
            return this.processBet(command, round);
        } else {
            // For WIN/CANCEL, usually simple single transaction (add funds)
            // But we might need more logic later. For now, simple create.
            return this.createTransaction({
                gameRound: round,
                aggregatorTxId: command.transaction.externalId,
                type: command.transaction.type,
                amount: command.transaction.amount,
                gameAmount: command.transaction.gameAmount,
                balanceType: WalletBalanceType.CASH, // Default to CASH for wins for now
                createdAt: command.transaction.occurredAt
            });
        }
    }

    private async processBet(command: ProcessGameActionCommand, round: GameRound): Promise<GameTransaction> {
        // Balance Check & Split Logic
        const wallet = await this.findUserWalletService.findWallet(
            command.user.id,
            command.currency.wallet,
            true // useLock
        );

        if (!wallet) {
            throw new Error(CasinoErrorCode.USER_BALANCE_NOT_FOUND);
        }

        const betAmount = command.transaction.amount;
        // [Domain Service Policy]
        const { cashDeduction, bonusDeduction } = BettingPolicy.calculateBalanceSplit(betAmount, wallet);

        let lastTx: GameTransaction | null = null;
        let gameAmountRemaining = command.transaction.gameAmount;

        // 1. Cash Part
        if (cashDeduction.gt(0)) {
            let cashGameAmount = command.transaction.gameAmount;
            if (bonusDeduction.gt(0)) {
                const ratio = cashDeduction.div(betAmount);
                cashGameAmount = command.transaction.gameAmount.mul(ratio);
                gameAmountRemaining = gameAmountRemaining.sub(cashGameAmount);
            }

            lastTx = await this.createTransaction({
                gameRound: round,
                aggregatorTxId: bonusDeduction.gt(0)
                    ? `${command.transaction.externalId}_CASH`
                    : command.transaction.externalId,
                type: GameTransactionType.BET,
                amount: cashDeduction,
                gameAmount: cashGameAmount,
                balanceType: WalletBalanceType.CASH,
                createdAt: command.transaction.occurredAt
            });
        }

        // 2. Bonus Part
        if (bonusDeduction.gt(0)) {
            lastTx = await this.createTransaction({
                gameRound: round,
                aggregatorTxId: cashDeduction.gt(0)
                    ? `${command.transaction.externalId}_BONUS`
                    : command.transaction.externalId,
                type: GameTransactionType.BET,
                amount: bonusDeduction,
                gameAmount: gameAmountRemaining,
                balanceType: WalletBalanceType.BONUS,
                createdAt: command.transaction.occurredAt
            });
        }

        if (!lastTx) throw new Error("Zero bet amount is not allowed");

        return lastTx;
    }

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
        // 1. Update Domain Entity State (Memory)
        if (transaction.type === GameTransactionType.BET) {
            round.addBet(transaction.amount, transaction.gameAmount);
        } else if (transaction.type === GameTransactionType.WIN || transaction.type === GameTransactionType.JACKPOT) {
            round.addWin(transaction.amount, transaction.gameAmount);
        }

        // 2. Persist Changes (Atomic Increment) to avoid race conditions
        const delta: any = {};

        if (transaction.type === GameTransactionType.BET) {
            delta.betAmount = transaction.amount;
            if (transaction.gameAmount) delta.gameBetAmount = transaction.gameAmount;
        } else if (transaction.type === GameTransactionType.WIN || transaction.type === GameTransactionType.JACKPOT) {
            delta.winAmount = transaction.amount;
            if (transaction.gameAmount) delta.gameWinAmount = transaction.gameAmount;
        }

        if (Object.keys(delta).length > 0) {
            await this.gameRoundRepository.increaseStats(round.id, round.startedAt, delta);
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
