import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { GameTransaction } from '../domain/model/game-transaction.entity';
import { GameTransactionRepositoryPort } from '../ports/out/game-transaction.repository.port';
import { GameTransactionMapper } from './game-transaction.mapper';
import { GameTransactionType } from '@prisma/client';

@Injectable()
export class PrismaGameTransactionRepository implements GameTransactionRepositoryPort {
    constructor(
        private readonly prisma: PrismaService,
        private readonly mapper: GameTransactionMapper,
    ) { }

    async save(transaction: GameTransaction): Promise<GameTransaction> {
        const data = this.mapper.toPrisma(transaction);
        const result = await this.prisma.gameTransaction.upsert({
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
        const result = await this.prisma.gameTransaction.findUnique({
            where: {
                id_roundStartedAt: {
                    id,
                    roundStartedAt,
                },
            },
        });
        return result ? this.mapper.toDomain(result) : null;
    }

    async findByExternalId(aggregatorTxId: string, type: GameTransactionType, roundStartedAt: Date): Promise<GameTransaction | null> {
        const result = await this.prisma.gameTransaction.findUnique({
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

    async findByRoundId(gameRoundId: bigint, roundStartedAt: Date): Promise<GameTransaction[]> {
        const results = await this.prisma.gameTransaction.findMany({
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
