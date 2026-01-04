import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { UserTierRepositoryPort } from '../ports/user-tier.repository.port';
import { UserTierMapper } from './user-tier.mapper';
import { UserTier } from '../domain';
import { TierException } from '../domain/tier.exception';
import { LockNamespace } from 'src/common/concurrency/lock-namespace';
import { DomainException } from 'src/common/exception/domain.exception';
import { MessageCode } from '@repo/shared';

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
        if (!userTier.id) throw new TierException('UserTier ID is required for update');
        const data = this.mapper.toPersistence(userTier);
        const model = await this.tx.userTier.update({
            where: { id: userTier.id },
            data,
            include: { tier: true },
        });
        return this.mapper.toDomain(model);
    }

    async countByTierId(tierId: bigint): Promise<number> {
        return this.tx.userTier.count({
            where: { tierId },
        });
    }

    async getTierUserCounts(): Promise<{ tierId: bigint; count: number }[]> {
        const result = await this.tx.userTier.groupBy({
            by: ['tierId'],
            _count: {
                _all: true,
            },
        });

        return result.map(item => ({
            tierId: item.tierId,
            count: item._count._all,
        }));
    }

    async acquireLock(userId: bigint): Promise<void> {
        try {
            // Set lock timeout to 3 seconds for current transaction
            await this.tx.$executeRaw`SET LOCAL lock_timeout = '3s'`;

            // Acquire advisory lock using USER_TIER namespace and userId
            await this.tx.$executeRaw`SELECT pg_advisory_xact_lock(('x' || substr(md5(${LockNamespace.USER_TIER}::text || ${userId.toString()}), 1, 16))::bit(64)::bigint)`;
        } catch (error: any) {
            const isLockTimeout =
                error.code === '55P03' ||
                error.meta?.code === '55P03' ||
                error.message?.includes('55P03') ||
                error.message?.includes('lock timeout');

            if (isLockTimeout) {
                throw new DomainException(
                    'User tier is being updated by another process. Please try again.',
                    MessageCode.THROTTLE_TOO_MANY_REQUESTS,
                    HttpStatus.TOO_MANY_REQUESTS,
                );
            }
            throw error;
        }
    }

    async findManyByTierId(tierId: bigint, skip: number, take: number): Promise<[UserTier[], number]> {
        const [items, total] = await Promise.all([
            this.tx.userTier.findMany({
                where: { tierId },
                include: { tier: true },
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            this.tx.userTier.count({
                where: { tierId },
            }),
        ]);

        return [items.map((item) => this.mapper.toDomain(item)), total];
    }
}
