import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { TierRewardRepositoryPort, CreateTierRewardProps } from './tier-reward.repository.port';
import { TierReward } from '../domain/tier-reward.entity';
import { TierUpgradeRewardStatus } from '@prisma/client';

@Injectable()
export class TierRewardRepository implements TierRewardRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
    ) { }

    async create(props: CreateTierRewardProps): Promise<TierReward> {
        const record = await this.tx.tierUpgradeReward.create({
            data: {
                userId: props.userId,
                tierId: props.tierId,
                fromLevel: props.fromLevel,
                toLevel: props.toLevel,
                bonusAmountUsd: props.bonusAmountUsd,
                wageringMultiplier: props.wageringMultiplier,
                referenceId: props.referenceId,
                tierHistoryId: props.tierHistoryId,
                expiresAt: props.expiresAt,
                status: TierUpgradeRewardStatus.PENDING,
            },
            include: { tier: { include: { translations: true } } },
        });

        return TierReward.fromPersistence(record);
    }

    async findById(id: bigint): Promise<TierReward | null> {
        const record = await this.tx.tierUpgradeReward.findUnique({
            where: { id },
            include: { tier: { include: { translations: true } } },
        });

        return record ? TierReward.fromPersistence(record) : null;
    }

    async findPendingByUserId(userId: bigint): Promise<TierReward[]> {
        const records = await this.tx.tierUpgradeReward.findMany({
            where: {
                userId,
                status: TierUpgradeRewardStatus.PENDING,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            },
            include: { tier: { include: { translations: true } } },
            orderBy: { createdAt: 'desc' },
        });

        return records.map(TierReward.fromPersistence);
    }

    async save(reward: TierReward): Promise<TierReward> {
        const record = await this.tx.tierUpgradeReward.update({
            where: { id: reward.id },
            data: {
                status: reward.status,
                claimedAt: reward.claimedAt,
                walletTxId: reward.walletTxId,
                cancelledAt: reward.cancelledAt,
                cancelReason: reward.cancelReason,
            },
            include: { tier: { include: { translations: true } } },
        });

        return TierReward.fromPersistence(record);
    }
}
