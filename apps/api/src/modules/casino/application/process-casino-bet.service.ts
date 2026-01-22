import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma, GameProvider, GameTransactionType, WalletBalanceType, WalletTransactionType } from '@prisma/client';
import { CasinoGameSession } from '../game-session/domain';
import { Transactional } from '@nestjs-cls/transactional';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import { GAME_ROUND_REPOSITORY_TOKEN } from '../ports/out/game-round.repository.token';
import type { GameRoundRepositoryPort } from '../ports/out/game-round.repository.port';
import { GAME_TRANSACTION_REPOSITORY_TOKEN } from '../ports/out/game-transaction.repository.token';
import type { GameTransactionRepositoryPort } from '../ports/out/game-transaction.repository.port';
import { UpdateUserBalanceService, BalanceUpdateParams } from 'src/modules/wallet/application/update-user-balance.service';
import { GameRound } from '../domain/model/game-round.entity';
import { UpdateOperation, WalletActionName } from 'src/modules/wallet/domain';
import { GameTransaction } from '../domain/model/game-transaction.entity';
import { CheckCasinoBalanceService } from './check-casino-balance.service';

export interface ProcessCasinoBetCommand {
    session: CasinoGameSession;
    amount: Prisma.Decimal;
    transactionId: string;
    roundId: string;
    gameId: bigint;
    betTime: Date;
    provider: GameProvider;
    description?: string;
}

export interface ProcessCasinoBetResult {
    balance: Prisma.Decimal;
    transactionId: bigint;
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
    ) { }

    @Transactional()
    async execute(command: ProcessCasinoBetCommand): Promise<ProcessCasinoBetResult> {
        const { session, amount, transactionId, roundId, gameId, betTime, description, provider } = command;

        if (!session.id) {
            throw new Error('Valid GameSession ID is required to process bet.');
        }

        // 1. Idempotency Check: Check if transaction already exists
        // We use betTime as a hint for the partition key (roundStartedAt)
        const existingTx = await this.gameTransactionRepository.findByExternalId(
            transactionId,
            GameTransactionType.BET,
            betTime,
        );

        if (existingTx) {
            this.logger.warn(`Duplicate bet request ignored: ${transactionId}`);
            // Return current balance if duplicate
            const balanceResult = await this.checkCasinoBalanceService.execute(session);
            return {
                balance: balanceResult.balance,
                transactionId: existingTx.id,
            };
        }

        // 2. Resolve Game Round
        // Try to find existing round. Warning: strict usage of betTime for startedAt lookup
        // depends on the repository strategy for time-window search.
        let round = await this.gameRoundRepository.findByExternalId(
            roundId,
            session.aggregatorType,
            betTime,
        );

        let isNewRound = false;
        if (!round) {
            const newRoundId = this.snowflakeService.generate(new Date());
            round = GameRound.create(
                newRoundId,
                session.userId,
                session.id,
                gameId,
                provider,
                session.aggregatorType,
                roundId,
                session.walletCurrency,
                session.gameCurrency,
                session.exchangeRate,
                betTime, // Set round startedAt to betTime
            );
            isNewRound = true;
        }

        // 3. Prepare Amounts (Wallet Currency)
        // walletAmount = gameAmount / exchangeRate
        const walletAmount = amount.div(session.exchangeRate);
        const newTxId = this.snowflakeService.generate(new Date());

        // 4. Update User Wallet (Locking & Balance Check)
        // Using UpdateUserBalanceService ensures atomic update and checks UserWalletPolicy
        const balanceUpdateParams: BalanceUpdateParams = {
            userId: session.userId,
            currency: session.walletCurrency,
            amount: walletAmount,
            operation: UpdateOperation.SUBTRACT, // Decrement
            balanceType: WalletBalanceType.CASH, // Default to CASH balance
            transactionType: WalletTransactionType.BET,
            referenceId: newTxId, // Link WalletTx to GameTx
        };

        const updatedWallet = await this.updateUserBalanceService.updateBalance(balanceUpdateParams, {
            actionName: WalletActionName.CASINO_BET,
            metadata: {
                roundId: String(round.id),
                gameId: String(gameId),
                aggregatorTxId: transactionId,
                description,
                provider,
            },
        });

        // 5. Create Game Transaction
        const gameTx = GameTransaction.create(
            newTxId,
            round.id,
            round.startedAt,
            session.userId,
            GameTransactionType.BET,
            transactionId,
            walletAmount,
            amount, // Original Game Amount
            WalletBalanceType.CASH,
            session.walletCurrency,
        );

        // 6. Persist Casino Entites
        if (isNewRound) {
            // Include valid bet stats in the new round
            round.addBet(walletAmount, amount);
            await this.gameRoundRepository.save(round);
        } else {
            // Atomic increment for existing round
            await this.gameRoundRepository.increaseStats(round.id, round.startedAt, {
                betAmount: walletAmount,
                gameBetAmount: amount,
            });
        }

        await this.gameTransactionRepository.save(gameTx);

        // 7. Return Result (Balance in Game Currency)
        const totalBalance = updatedWallet.totalAvailableBalance;
        const balanceInGameCurrency = totalBalance.mul(session.exchangeRate);

        return {
            balance: balanceInGameCurrency,
            transactionId: newTxId,
        };
    }
}
