import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { UserTierRepositoryPort } from '../ports/user-tier.repository.port';
import { UserTierMapper } from './user-tier.mapper';
import { UserTier } from '../domain';
import { TierException } from '../domain/tier.exception';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';

@Injectable()
export class UserTierRepository implements UserTierRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
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

    async findUserIdsWithoutTier(): Promise<bigint[]> {
        const users = await this.tx.user.findMany({
            where: {
                userTier: {
                    is: null,
                },
            },
            select: {
                id: true,
            },
        });

        return users.map((user) => user.id);
    }
}
