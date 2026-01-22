import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { GameRound } from '../domain/model/game-round.entity';
import { GameRoundRepositoryPort } from '../ports/out/game-round.repository.port';
import { GameRoundMapper } from './game-round.mapper';
import { GameAggregatorType } from '@prisma/client';

@Injectable()
export class PrismaGameRoundRepository implements GameRoundRepositoryPort {
    constructor(
        private readonly prisma: PrismaService,
        private readonly mapper: GameRoundMapper,
    ) { }

    async save(gameRound: GameRound): Promise<GameRound> {
        const data = this.mapper.toPrisma(gameRound);
        const result = await this.prisma.gameRoundV2.upsert({
            where: {
                id_startedAt: {
                    id: data.id,
                    startedAt: data.startedAt,
                },
            },
            update: data,
            create: data,
        });
        return this.mapper.toDomain(result);
    }

    async findById(id: bigint, startedAt: Date): Promise<GameRound | null> {
        const result = await this.prisma.gameRoundV2.findUnique({
            where: {
                id_startedAt: {
                    id,
                    startedAt,
                },
            },
        });
        return result ? this.mapper.toDomain(result) : null;
    }

    async findByExternalId(externalRoundId: string, aggregatorType: GameAggregatorType, startedAt: Date): Promise<GameRound | null> {
        const result = await this.prisma.gameRoundV2.findUnique({
            where: {
                aggregatorRoundId_aggregatorType_startedAt: {
                    aggregatorRoundId: externalRoundId,
                    aggregatorType,
                    startedAt,
                },
            },
        });
        return result ? this.mapper.toDomain(result) : null;
    }

    async updateStats(id: bigint, startedAt: Date, stats: {
        totalBetAmount?: number;
        totalWinAmount?: number;
        totalGameBetAmount?: number;
        totalGameWinAmount?: number;
    }): Promise<void> {
        await this.prisma.gameRoundV2.update({
            where: {
                id_startedAt: {
                    id,
                    startedAt,
                },
            },
            data: stats,
        });
    }
}
