import { Inject, Injectable } from '@nestjs/common';
import { GameRound } from '../domain/model/game-round.entity';
import { GameRoundRepositoryPort } from '../ports/out/game-round.repository.port';
import { GameRoundMapper } from './game-round.mapper';
import { GameAggregatorType, Prisma } from '@prisma/client';
import { EXTENDED_PRISMA_CLIENT } from 'src/infrastructure/prisma/prisma.module';
import type { ExtendedClient } from 'src/infrastructure/prisma/prisma.service';
import { LockNamespace, CONCURRENCY_CONSTANTS, DbLockUtil } from 'src/common/concurrency/lock-namespace';
import { sql } from 'kysely';

@Injectable()
export class GameRoundRepository implements GameRoundRepositoryPort {
    constructor(
        @Inject(EXTENDED_PRISMA_CLIENT)
        private readonly prisma: ExtendedClient,
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

    async findByExternalIdWithWindow(
        externalRoundId: string,
        aggregatorType: GameAggregatorType,
        referenceTime: Date,
        windowHours: number = 24,
    ): Promise<GameRound | null> {
        const windowStart = new Date(referenceTime.getTime() - windowHours * 60 * 60 * 1000);
        const windowEnd = new Date(referenceTime.getTime() + windowHours * 60 * 60 * 1000);

        const result = await this.prisma.gameRoundV2.findFirst({
            where: {
                aggregatorRoundId: externalRoundId,
                aggregatorType,
                startedAt: {
                    gte: windowStart,
                    lte: windowEnd,
                },
            },
            orderBy: {
                startedAt: 'desc',
            },
        });
        return result ? this.mapper.toDomain(result) : null;
    }

    async increaseStats(id: bigint, startedAt: Date, delta: {
        betAmount?: Prisma.Decimal;
        winAmount?: Prisma.Decimal;
        gameBetAmount?: Prisma.Decimal;
        gameWinAmount?: Prisma.Decimal;
        refundAmount?: Prisma.Decimal;
        gameRefundAmount?: Prisma.Decimal;
        jackpotAmount?: Prisma.Decimal;
        gameJackpotAmount?: Prisma.Decimal;
        compEarned?: Prisma.Decimal;
        jackpotContributionAmount?: Prisma.Decimal;
    }): Promise<void> {
        const updateData: any = {};
        if (delta.betAmount) updateData.totalBetAmount = { increment: delta.betAmount };
        if (delta.winAmount) updateData.totalWinAmount = { increment: delta.winAmount };
        if (delta.gameBetAmount) updateData.totalGameBetAmount = { increment: delta.gameBetAmount };
        if (delta.gameWinAmount) updateData.totalGameWinAmount = { increment: delta.gameWinAmount };
        if (delta.refundAmount) updateData.totalRefundAmount = { increment: delta.refundAmount };
        if (delta.gameRefundAmount) updateData.totalGameRefundAmount = { increment: delta.gameRefundAmount };
        if (delta.jackpotAmount) updateData.totalJackpotAmount = { increment: delta.jackpotAmount };
        if (delta.gameJackpotAmount) updateData.totalGameJackpotAmount = { increment: delta.gameJackpotAmount };
        if (delta.compEarned) updateData.compEarned = { increment: delta.compEarned };
        if (delta.jackpotContributionAmount) updateData.jackpotContributionAmount = { increment: delta.jackpotContributionAmount };

        if (Object.keys(updateData).length === 0) return;

        await this.prisma.gameRoundV2.update({
            where: {
                id_startedAt: {
                    id,
                    startedAt,
                },
            },
            data: updateData,
        });
    }

    async acquireLock(externalRoundId: string): Promise<void> {
        try {
            // 락 타임아웃 설정 (Kysely)
            await sql`SET LOCAL lock_timeout = ${CONCURRENCY_CONSTANTS.DB_LOCK_TIMEOUT}`
                .execute(this.prisma.$kysely);

            // 락 획득 (DbLockUtil 사용)
            await sql`SELECT pg_advisory_xact_lock(${DbLockUtil.generateAdvisoryLockKey(LockNamespace.GAME_ROUND, externalRoundId)})`
                .execute(this.prisma.$kysely);
        } catch (error: any) {
            if (DbLockUtil.isLockTimeout(error)) {
                // 이미 처리 중인 경우 멱등성 로직으로 넘기기 위해 에러 발생
                throw error;
            }
            throw error;
        }
    }
}
