import { CasinoGameTransactionType } from '@prisma/client';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';

import { Injectable } from '@nestjs/common';
import { GameTransaction } from '../domain/game-transaction.entity';
import { GameTransactionRepositoryPort } from '../ports/game-transaction.repository.port';
import { GameTransactionMapper } from './game-transaction.mapper';

@Injectable()
export class GameTransactionRepository implements GameTransactionRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: GameTransactionMapper,
  ) { }

  async save(transaction: GameTransaction): Promise<GameTransaction> {
    const data = this.mapper.toPrisma(transaction);
    const result = await this.tx.casinoGameTransaction.upsert({
      where: {
        id_roundStartedAt: {
          id: data.id,
          roundStartedAt: data.roundStartedAt,
        },
      },
      update: data,
      create: data,
    });
    return this.mapper.toDomain(result);
  }

  async findById(
    id: bigint,
    roundStartedAt: Date,
  ): Promise<GameTransaction | null> {
    const result = await this.tx.casinoGameTransaction.findUnique({
      where: {
        id_roundStartedAt: {
          id,
          roundStartedAt,
        },
      },
    });
    return result ? this.mapper.toDomain(result) : null;
  }

  async findByExternalId(
    aggregatorTxId: string,
    type: CasinoGameTransactionType,
    roundStartedAt: Date,
  ): Promise<GameTransaction | null> {
    const result = await this.tx.casinoGameTransaction.findUnique({
      where: {
        aggregatorTxId_type_roundStartedAt: {
          aggregatorTxId,
          type,
          roundStartedAt,
        },
      },
    });
    return result ? this.mapper.toDomain(result) : null;
  }

  async findAllByRoundId(
    gameRoundId: bigint,
    roundStartedAt: Date,
  ): Promise<GameTransaction[]> {
    const results = await this.tx.casinoGameTransaction.findMany({
      where: {
        gameRoundId,
        roundStartedAt,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    return results.map((result) => this.mapper.toDomain(result));
  }
}
