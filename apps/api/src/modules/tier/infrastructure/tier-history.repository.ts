import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { TierHistoryRepositoryPort, FindTierHistoryIsParams, FindTierHistoryResult, TierHistoryWithRelations } from '../ports/tier-history.repository.port';
import { TierHistoryMapper } from './tier-history.mapper';
import { TierHistory } from '../domain';
import { Prisma } from '@repo/database';

@Injectable()
export class TierHistoryRepository implements TierHistoryRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
        private readonly mapper: TierHistoryMapper,
    ) { }

    async create(history: TierHistory): Promise<TierHistory> {
        const data = this.mapper.toPersistence(history);
        const model = await this.tx.tierHistory.create({ data });
        return this.mapper.toDomain(model);
    }

    async findByUserId(userId: bigint): Promise<TierHistory[]> {
        const models = await this.tx.tierHistory.findMany({
            where: { userId },
            orderBy: { changedAt: 'desc' },
        });
        return models.map(model => this.mapper.toDomain(model));
    }

    async findHistory(params: FindTierHistoryIsParams): Promise<FindTierHistoryResult> {
        const { userId, page, limit } = params;
        const skip = (page - 1) * limit;

        const where: Prisma.TierHistoryWhereInput = {};
        if (userId) {
            // Find user id by uid
            const user = await this.tx.user.findUnique({ where: { id: userId } });
            if (user) {
                where.userId = user.id;
            } else {
                return { items: [], total: 0 };
            }
        }

        const [total, models] = await Promise.all([
            this.tx.tierHistory.count({ where }),
            this.tx.tierHistory.findMany({
                where,
                skip,
                take: limit,
                orderBy: { changedAt: 'desc' },
                include: {
                    user: true,
                    fromTier: true,
                    toTier: true,
                }
            })
        ]);

        const items = models.map(model => {
            const domain = this.mapper.toDomain(model);
            return {
                ...domain,
                userEmail: model.user.email,
                oldTierCode: model.fromTier?.code ?? null,
                newTierCode: model.toTier?.code ?? 'Unknown',
            } as TierHistoryWithRelations;
        });

        return { items, total };
    }
}
