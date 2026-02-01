import { Injectable } from '@nestjs/common';
import { UserTierRepositoryPort } from '../infrastructure/user-tier.repository.port';
import { UserTierStatus } from '@prisma/client';
import { PaginatedData } from 'src/common/http/types/pagination.types';

export interface ListUserTiersParams {
    tierId?: bigint;
    status?: UserTierStatus;
    userId?: bigint;
    email?: string;
    search?: string;
    page: number;
    limit: number;
}

export interface UserTierListItemResult {
    id: string;
    userId: string;
    tierId: string;
    tierName: string;
    totalEffectiveRollingUsd: string;
    currentPeriodRollingUsd: string;
    currentPeriodDepositUsd: string;
    status: UserTierStatus;
    lastTierChangedAt: Date;
    nextEvaluationAt: Date | null;
    highestPromotedRank: number;
    lastBonusReceivedAt: Date | null;
    graceEndsAt: Date | null;
    isBonusEligible: boolean;
    note: string | null;
    demotionWarningIssuedAt: Date | null;
    demotionWarningTargetTierId: string | null;
    demotionWarningTargetTierName: string | null;
    hasCustomOverrides: boolean;
    currentBenefits: {
        compRate: string;
        lossbackRate: string;
        rakebackRate: string;
        reloadBonusRate: string;
        dailyWithdrawalLimitUsd: string;
        isWithdrawalUnlimited: boolean;
        hasDedicatedManager: boolean;
        isVIPEventEligible: boolean;
    };
}

@Injectable()
export class ListUserTiersService {
    constructor(
        private readonly userTierRepository: UserTierRepositoryPort,
    ) { }

    async execute(params: ListUserTiersParams): Promise<PaginatedData<UserTierListItemResult>> {
        const { items, total } = await this.userTierRepository.findMany(params);

        return {
            data: items.map(ut => {
                const benefits = ut.getEffectiveBenefits();
                return {
                    id: ut.id.toString(),
                    userId: ut.userId.toString(),
                    tierId: ut.tierId.toString(),
                    tierName: ut.tier?.getName() ?? 'Unknown',
                    totalEffectiveRollingUsd: ut.totalEffectiveRollingUsd.toString(),
                    currentPeriodRollingUsd: ut.currentPeriodRollingUsd.toString(),
                    currentPeriodDepositUsd: ut.currentPeriodDepositUsd.toString(),
                    status: ut.status,
                    lastTierChangedAt: ut.lastTierChangedAt,
                    nextEvaluationAt: ut.nextEvaluationAt,
                    highestPromotedRank: ut.highestPromotedRank,
                    lastBonusReceivedAt: ut.lastBonusReceivedAt,
                    graceEndsAt: ut.graceEndsAt,
                    isBonusEligible: ut.isBonusEligible,
                    note: ut.note,
                    demotionWarningIssuedAt: ut.demotionWarningIssuedAt,
                    demotionWarningTargetTierId: ut.demotionWarningTargetTierId?.toString() ?? null,
                    demotionWarningTargetTierName: ut.demotionWarningTargetTier?.getName() ?? null,
                    hasCustomOverrides: !!(
                        ut.customCompRate ||
                        ut.customLossbackRate ||
                        ut.customRakebackRate ||
                        ut.customReloadBonusRate ||
                        ut.customWithdrawalLimitUsd ||
                        ut.isCustomWithdrawalUnlimited !== null ||
                        ut.isCustomDedicatedManager !== null ||
                        ut.isCustomVipEventEligible !== null
                    ),
                    currentBenefits: {
                        compRate: benefits.compRate.toString(),
                        lossbackRate: benefits.lossbackRate.toString(),
                        rakebackRate: benefits.rakebackRate.toString(),
                        reloadBonusRate: benefits.reloadBonusRate.toString(),
                        dailyWithdrawalLimitUsd: benefits.dailyWithdrawalLimitUsd.toString(),
                        isWithdrawalUnlimited: benefits.isWithdrawalUnlimited,
                        hasDedicatedManager: benefits.hasDedicatedManager,
                        isVIPEventEligible: benefits.isVIPEventEligible,
                    },
                };
            }),
            total,
            page: params.page,
            limit: params.limit,
        };
    }
}
