import { Inject, Injectable } from '@nestjs/common';
import { GAME_ROUND_REPOSITORY_TOKEN } from '../ports/game-round.repository.token';
import type { GameRoundRepositoryPort } from '../ports/game-round.repository.port';
import { GAME_TRANSACTION_REPOSITORY_TOKEN } from '../ports/game-transaction.repository.token';
import type { GameTransactionRepositoryPort } from '../ports/game-transaction.repository.port';
import { GameTransaction } from '../domain/game-transaction.entity';
import { GameRound } from '../domain/game-round.entity';
import { CasinoGameTransactionType, UserWalletBalanceType, ExchangeCurrencyCode, Prisma } from '@prisma/client';

export interface RecordTransactionCommand {
  id: bigint;
  gameRoundId: bigint;
  roundStartedAt: Date;
  userId: bigint;
  type: CasinoGameTransactionType;
  aggregatorTxId: string;
  amount: Prisma.Decimal;
  balanceBefore: Prisma.Decimal;
  gameAmount: Prisma.Decimal | null;
  balanceType: UserWalletBalanceType;
  currency: ExchangeCurrencyCode;
  createdAt?: Date;
}

@Injectable()
export class GameRoundHistoryService {
  constructor(
    @Inject(GAME_ROUND_REPOSITORY_TOKEN)
    private readonly gameRoundRepository: GameRoundRepositoryPort,
    @Inject(GAME_TRANSACTION_REPOSITORY_TOKEN)
    private readonly gameTransactionRepository: GameTransactionRepositoryPort,
  ) { }

  async checkTransactionExists(
    externalTxId: string,
    type: CasinoGameTransactionType,
    roundStartedAt: Date,
  ): Promise<boolean> {
    const existingTx = await this.gameTransactionRepository.findByExternalId(
      externalTxId,
      type,
      roundStartedAt,
    );
    return !!existingTx;
  }

  async getOriginalBet(
    externalTxId: string,
    roundStartedAt: Date,
  ): Promise<GameTransaction | null> {
    return this.gameTransactionRepository.findByExternalId(
      externalTxId,
      CasinoGameTransactionType.BET,
      roundStartedAt,
    );
  }

  async recordTransaction(command: RecordTransactionCommand): Promise<GameTransaction> {
    const tx = GameTransaction.create(
      command.id,
      command.gameRoundId,
      command.roundStartedAt,
      command.userId,
      command.type,
      command.aggregatorTxId,
      command.amount,
      command.balanceBefore,
      command.gameAmount,
      command.balanceType,
      command.currency,
      command.createdAt || new Date(),
    );
    return this.gameTransactionRepository.save(tx);
  }

  async increaseRoundStats(
    id: bigint,
    startedAt: Date,
    delta: Parameters<GameRoundRepositoryPort['increaseStats']>[2],
  ): Promise<void> {
    await this.gameRoundRepository.increaseStats(id, startedAt, delta);
  }

  async completeRound(round: GameRound): Promise<void> {
    round.complete();
    await this.gameRoundRepository.save(round);
  }
}
