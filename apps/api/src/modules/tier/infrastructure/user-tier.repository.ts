import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { UserTierRepositoryPort } from '../ports/user-tier.repository.port';
import { UserTierMapper } from './user-tier.mapper';
import { UserTier } from '../domain';

@Injectable()
export class UserTierRepository implements UserTierRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: Transaction<TransactionalAdapterPrisma>,
        private readonly mapper: UserTierMapper,
    ) { }

    async findByUserId(userId: bigint): Promise<UserTier | null> {
        const model = await this.tx.userTier.findUnique({
            where: { userId },
            include: { tier: true },
        });
        return model ? this.mapper.toDomain(model) : null;
    }

    async findByUid(uid: string): Promise<UserTier | null> {
        const model = await this.tx.userTier.findUnique({
            where: { uid },
            include: { tier: true },
        });
        return model ? this.mapper.toDomain(model) : null;
    }

    async create(userTier: UserTier): Promise<UserTier> {
        const data = this.mapper.toPersistence(userTier);
        const model = await this.tx.userTier.create({
            data,
            include: { tier: true },
        });
        return this.mapper.toDomain(model);
    }

    async update(userTier: UserTier): Promise<UserTier> {
        if (!userTier.id) throw new Error('UserTier ID is required for update');
        const data = this.mapper.toPersistence(userTier);
        const model = await this.tx.userTier.update({
            where: { id: userTier.id },
            data,
            include: { tier: true },
        });
        return this.mapper.toDomain(model);
    }
}
