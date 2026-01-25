import { Inject, Injectable } from '@nestjs/common';
import { GameTransaction } from '../domain/model/game-transaction.entity';
import { GameTransactionRepositoryPort } from '../ports/out/game-transaction.repository.port';
import { GameTransactionMapper } from './game-transaction.mapper';
import { CasinoGameTransactionType } from '@prisma/client';
import { EXTENDED_PRISMA_CLIENT } from 'src/infrastructure/prisma/prisma.module';
import type { ExtendedClient } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class GameTransactionRepository implements GameTransactionRepositoryPort {
    constructor(
        @Inject(EXTENDED_PRISMA_CLIENT)
        private readonly prisma: ExtendedClient,
        private readonly mapper: GameTransactionMapper,
    ) { }

    async save(transaction: GameTransaction): Promise<GameTransaction> {
        const data = this.mapper.toPrisma(transaction);
        const result = await this.prisma.casinoGameTransaction.upsert({
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

    async findById(id: bigint, roundStartedAt: Date): Promise<GameTransaction | null> {
        const result = await this.prisma.casinoGameTransaction.findUnique({
            where: {
                id_roundStartedAt: {
                    id,
                    roundStartedAt,
                },
            },
        });
        return result ? this.mapper.toDomain(result) : null;
    }

    async findByExternalId(aggregatorTxId: string, type: CasinoGameTransactionType, roundStartedAt: Date): Promise<GameTransaction | null> {
        const result = await this.prisma.casinoGameTransaction.findUnique({
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

    async findAllByRoundId(gameRoundId: bigint, roundStartedAt: Date): Promise<GameTransaction[]> {
        const results = await this.prisma.casinoGameTransaction.findMany({
            where: {
                gameRoundId,
                roundStartedAt,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
        return results.map(result => this.mapper.toDomain(result));
    }
}
