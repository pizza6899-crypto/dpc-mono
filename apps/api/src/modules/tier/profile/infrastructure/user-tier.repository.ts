import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { UserTier } from '../domain/user-tier.entity';
import { UserTierRepositoryPort } from './user-tier.repository.port';
import { UserTierStatus } from '@prisma/client';

@Injectable()
export class UserTierRepository implements UserTierRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
    ) { }

    async findByUserId(userId: bigint): Promise<UserTier | null> {
        const record = await this.tx.userTier.findUnique({
            where: { userId },
            include: {
                tier: { include: { translations: true } },
                downgradeWarningTargetTier: { include: { translations: true } }
            }
        });
        return record ? UserTier.fromPersistence(record) : null;
    }

    async save(userTier: UserTier): Promise<UserTier> {
        const data = {
            tierId: userTier.tierId,
            lifetimeRollingUsd: userTier.lifetimeRollingUsd,
            statusRollingUsd: userTier.statusRollingUsd,
            currentPeriodRollingUsd: userTier.currentPeriodRollingUsd,
            lifetimeDepositUsd: userTier.lifetimeDepositUsd,
            currentPeriodDepositUsd: userTier.currentPeriodDepositUsd,
            lastEvaluationAt: userTier.lastEvaluationAt,
            currentLevel: userTier.currentLevel,
            maxLevelAchieved: userTier.maxLevelAchieved,
            lastBonusReceivedAt: userTier.lastBonusReceivedAt,
            status: userTier.status,
            downgradeGracePeriodEndsAt: userTier.downgradeGracePeriodEndsAt,
            lastTierChangedAt: userTier.lastTierChangedAt,
            lastUpgradeAt: userTier.lastUpgradeAt,
            lastDowngradeAt: userTier.lastDowngradeAt,
            customCompRate: userTier.customCompRate,
            customWeeklyLossbackRate: userTier.customWeeklyLossbackRate,
            customMonthlyLossbackRate: userTier.customMonthlyLossbackRate,
            customWithdrawalLimitUsd: userTier.customWithdrawalLimitUsd,
            isCustomWithdrawalUnlimited: userTier.isCustomWithdrawalUnlimited,
            isCustomDedicatedManager: userTier.isCustomDedicatedManager,
            isBonusEligible: userTier.isBonusEligible,
            nextEvaluationAt: userTier.nextEvaluationAt,
            note: userTier.note,
            downgradeWarningIssuedAt: userTier.downgradeWarningIssuedAt,
            downgradeWarningTargetTierId: userTier.downgradeWarningTargetTierId,
        };

        const record = await this.tx.userTier.upsert({
            where: { userId: userTier.userId },
            create: { userId: userTier.userId, ...data },
            update: data,
            include: {
                tier: { include: { translations: true } },
                downgradeWarningTargetTier: { include: { translations: true } }
            }
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

    async countGroupByTierAndStatus(): Promise<{ tierId: bigint; status: UserTierStatus; count: number }[]> {
        const groups = await this.tx.userTier.groupBy({
            by: ['tierId', 'status'],
            _count: { userId: true }
        });

        return groups.map(g => ({
            tierId: g.tierId,
            status: g.status as UserTierStatus,
            count: g._count.userId
        }));
    }

    async incrementRolling(userId: bigint, amountUsd: number): Promise<UserTier> {
        const record = await this.tx.userTier.update({
            where: { userId },
            data: {
                lifetimeRollingUsd: { increment: amountUsd },
                statusRollingUsd: { increment: amountUsd },
                currentPeriodRollingUsd: { increment: amountUsd },
            },
            include: {
                tier: { include: { translations: true } },
                downgradeWarningTargetTier: { include: { translations: true } }
            }
        });

        return UserTier.fromPersistence(record);
    }

    async incrementDeposit(userId: bigint, amountUsd: number): Promise<UserTier> {
        const record = await this.tx.userTier.update({
            where: { userId },
            data: {
                lifetimeDepositUsd: { increment: amountUsd },
                currentPeriodDepositUsd: { increment: amountUsd },
            },
            include: {
                tier: { include: { translations: true } },
                downgradeWarningTargetTier: { include: { translations: true } }
            }
        });

        return UserTier.fromPersistence(record);
    }

    async findIdsNeedingEvaluation(now: Date, limit: number, cursor?: bigint): Promise<bigint[]> {
        const records = await this.tx.userTier.findMany({
            where: {
                nextEvaluationAt: { lte: now }
            },
            take: limit,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { userId: cursor } : undefined,
            select: { userId: true },
            orderBy: { userId: 'asc' }
        });

        return records.map(r => r.userId);
    }

    async findMany(params: {
        tierId?: bigint;
        status?: UserTierStatus;
        userId?: bigint;
        email?: string;
        search?: string;
        page: number;
        limit: number;
    }): Promise<{ items: UserTier[]; total: number }> {
        const { tierId, status, userId, email, search, page, limit } = params;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (tierId) where.tierId = tierId;
        if (status) where.status = status;
        if (userId) where.userId = userId;
        if (email) {
            where.user = { email: { contains: email, mode: 'insensitive' } };
        }
        if (search) {
            const or: any[] = [
                { user: { email: { contains: search, mode: 'insensitive' } } }
            ];

            if (/^\d+$/.test(search)) {
                try {
                    or.push({ userId: BigInt(search) });
                } catch (e) { /* ignore */ }
            }
            where.OR = or;
        }

        const [records, total] = await Promise.all([
            this.tx.userTier.findMany({
                where,
                include: {
                    tier: { include: { translations: true } },
                    downgradeWarningTargetTier: { include: { translations: true } }
                },
                skip,
                take: limit,
                orderBy: { userId: 'asc' }
            }),
            this.tx.userTier.count({ where })
        ]);

        return {
            items: records.map(UserTier.fromPersistence),
            total
        };
    }
}
