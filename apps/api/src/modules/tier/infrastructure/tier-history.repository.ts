import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TierHistoryRepositoryPort } from '../ports/tier-history.repository.port';
import { TierHistoryMapper } from './tier-history.mapper';
import { TierHistory } from '../domain';

@Injectable()
export class TierHistoryRepository implements TierHistoryRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: Transaction<TransactionalAdapterPrisma>,
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
}
