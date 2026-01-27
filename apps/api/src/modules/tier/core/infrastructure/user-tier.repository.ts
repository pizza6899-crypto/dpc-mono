import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { UserTier } from '../../domain/user-tier.entity';
import { UserTierRepositoryPort } from './user-tier.repository.port';

@Injectable()
export class UserTierRepository implements UserTierRepositoryPort {
    constructor(private readonly prisma: PrismaService) { }

    async findByUserId(userId: bigint): Promise<UserTier | null> {
        const record = await this.prisma.userTier.findUnique({
            where: { userId },
            include: {
                tier: {
                    include: {
                        translations: true,
                    },
                },
            },
        });
        return record ? UserTier.fromPersistence(record) : null;
    }

    async save(userTier: UserTier): Promise<UserTier> {
        const data = {
            tierId: userTier.tierId,
            totalEffectiveRollingUsd: userTier.totalEffectiveRollingUsd,
            currentPeriodRollingUsd: userTier.currentPeriodRollingUsd,
            lastEvaluationAt: userTier.lastEvaluationAt,
            highestPromotedPriority: userTier.highestPromotedPriority,
            status: userTier.status,
            graceEndsAt: userTier.graceEndsAt,
            lastTierChangedAt: userTier.lastTierChangedAt,
            customCompRate: userTier.customCompRate,
            customLossbackRate: userTier.customLossbackRate,
            customRakebackRate: userTier.customRakebackRate,
            customReloadBonusRate: userTier.customReloadBonusRate,
            customWithdrawalLimitUsd: userTier.customWithdrawalLimitUsd,
            isCustomWithdrawalUnlimited: userTier.isCustomWithdrawalUnlimited,
            isCustomDedicatedManager: userTier.isCustomDedicatedManager,
            isCustomVipEventEligible: userTier.isCustomVipEventEligible,
            isBonusEligible: userTier.isBonusEligible,
        };

        const record = await this.prisma.userTier.upsert({
            where: { userId: userTier.userId },
            create: {
                userId: userTier.userId,
                ...data,
            },
            update: data,
            include: {
                tier: {
                    include: {
                        translations: true,
                    },
                },
            },
        });

        return UserTier.fromPersistence(record);
    }
}
