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
    ) { }

    @Transactional()
    async execute(command: ProcessCasinoCreditCommand): Promise<ProcessCasinoCreditResult> {
        const { session, amount, transactionId, roundId, gameId, winTime, provider, isCancel, isJackpot, isBonus, description } = command;

        // 1. Acquire Advisory Lock (Round Level)
        try {
            await this.gameRoundRepository.acquireLock(roundId);
        } catch (error) {
            this.logger.error(`Failed to acquire lock for round: ${roundId}`, error);
            throw error;
        }

        // 2. Resolve Game Round
        let round = await this.gameRoundRepository.findByExternalIdWithWindow(
            roundId,
            session.aggregatorType,
            winTime,
        );

        const anchorTime = round ? round.startedAt : winTime;

        if (!round) {
            this.logger.warn(`WIN 요청을 위한 라운드가 존재하지 않음: ${roundId}. 새로운 라운드 생성 시도.`);
            const newRoundId = this.snowflakeService.generate(winTime);
            round = GameRound.create(
                newRoundId,
                session.userId,
                session.id!,
                gameId,
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

        // 4. 지급 처리 (현금 잔액으로 지급)
        const walletAmount = amount.div(session.exchangeRate);
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
            },
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
            amount,
            WalletBalanceType.CASH,
            session.walletCurrency,
            winTime,
        );
        await this.gameTransactionRepository.save(winTx);

        // 6. 라운드 통계 업데이트
        const statsDelta: any = {};
        if (isCancel) {
            statsDelta.refundAmount = walletAmount;
            statsDelta.gameRefundAmount = amount;
        } else if (isJackpot) {
            statsDelta.jackpotAmount = walletAmount;
            statsDelta.gameJackpotAmount = amount;
        } else {
            // General Win & Bonus
            statsDelta.winAmount = walletAmount;
            statsDelta.gameWinAmount = amount;
        }

        await this.gameRoundRepository.increaseStats(round.id, round.startedAt, statsDelta);

        // 7. Return Result
        const balanceInGameCurrency = updatedWallet.totalAvailableBalance.mul(session.exchangeRate);

        return {
            balance: balanceInGameCurrency,
        };
    }
}
