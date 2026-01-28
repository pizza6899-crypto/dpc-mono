import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { UserTier } from '../domain/user-tier.entity';
import { UserTierRepositoryPort } from './user-tier.repository.port';

@Injectable()
export class UserTierRepository implements UserTierRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
    ) { }

    async findByUserId(userId: bigint): Promise<UserTier | null> {
        const record = await this.tx.userTier.findUnique({
            where: { userId },
            include: { tier: { include: { translations: true } } }
        });
        return record ? UserTier.fromPersistence(record) : null;
    }

    async save(userTier: UserTier): Promise<UserTier> {
        const data = {
            tierId: userTier.tierId,
            totalEffectiveRollingUsd: userTier.totalEffectiveRollingUsd,
            currentPeriodRollingUsd: userTier.currentPeriodRollingUsd,
            currentPeriodDepositUsd: userTier.currentPeriodDepositUsd,
            lastEvaluationAt: userTier.lastEvaluationAt,
            highestPromotedPriority: userTier.highestPromotedPriority,
            lastBonusReceivedAt: userTier.lastBonusReceivedAt,
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
            nextEvaluationAt: userTier.nextEvaluationAt,
            note: userTier.note,
            demotionWarningIssuedAt: userTier.demotionWarningIssuedAt,
            demotionWarningTargetTierId: userTier.demotionWarningTargetTierId,
        };

        const record = await this.tx.userTier.upsert({
            where: { userId: userTier.userId },
            create: { userId: userTier.userId, ...data },
            update: data,
            include: { tier: { include: { translations: true } } }
        });

        return UserTier.fromPersistence(record);
    }

    async countGroupByTierId(): Promise<{ tierId: bigint; count: number }[]> {
        const groups = await this.tx.userTier.groupBy({
            by: ['tierId'],
            _count: { userId: true }
        });

        return groups.map(g => ({
            tierId: g.tierId,
            count: g._count.userId
        }));
    }

    async incrementRolling(userId: bigint, amountUsd: number): Promise<void> {
        await this.tx.userTier.updateMany({
            where: { userId },
            data: {
                totalEffectiveRollingUsd: { increment: amountUsd },
                currentPeriodRollingUsd: { increment: amountUsd },
            }
        });
    }

    async incrementDeposit(userId: bigint, amountUsd: number): Promise<void> {
        await this.tx.userTier.updateMany({
            where: { userId },
            data: {
                currentPeriodDepositUsd: { increment: amountUsd },
            }
        });
    }

    async findUsersNeedingEvaluation(now: Date): Promise<UserTier[]> {
        const records = await this.tx.userTier.findMany({
            where: {
                nextEvaluationAt: {
                    lte: now
                }
            },
            include: { tier: { include: { translations: true } } }
        });

        return records.map(UserTier.fromPersistence);
    }
}
