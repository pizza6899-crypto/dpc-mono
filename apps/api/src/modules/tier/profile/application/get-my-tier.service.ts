import { Injectable, NotFoundException } from '@nestjs/common';
import { UserTierRepositoryPort } from '../infrastructure/user-tier.repository.port';
import { UserTierStatus, Prisma, Language } from '@prisma/client';
import { UserTier } from '../domain/user-tier.entity';

export interface MyTierResult {
    userTierId: bigint;
    tierId: bigint;
    name: string;
    imageUrl: string | null;
    status: UserTierStatus;
    lastTierChangedAt: Date;
    nextEvaluationAt: Date | null;
    benefits: {
        compRate: Prisma.Decimal;
        lossbackRate: Prisma.Decimal;
        rakebackRate: Prisma.Decimal;
        reloadBonusRate: Prisma.Decimal;
        dailyWithdrawalLimitUsd: Prisma.Decimal;
        isWithdrawalUnlimited: boolean;
        hasDedicatedManager: boolean;
        isVIPEventEligible: boolean;
    };
}

@Injectable()
export class GetMyTierService {
    constructor(
        private readonly userTierRepository: UserTierRepositoryPort,
    ) { }

    /**
     * 유저 아이디로 유저 티어 엔티티를 조회합니다. (Join 포함)
     */
    async findUserTier(userId: bigint): Promise<UserTier> {
        const userTier = await this.userTierRepository.findByUserId(userId);
        if (!userTier || !userTier.tier) {
            throw new NotFoundException('User tier info not initialized');
        }
        return userTier;
    }

    /**
     * 유저 티어 엔티티를 포맷팅된 결과로 변환합니다.
     */
    execute(userTier: UserTier, language: Language): MyTierResult {
        const currentTier = userTier.tier!;
        const benefits = userTier.getEffectiveBenefits();

        return {
            userTierId: userTier.id,
            tierId: currentTier.id,
            name: currentTier.getName(language),
            imageUrl: currentTier.imageUrl,
            status: userTier.status,
            lastTierChangedAt: userTier.lastTierChangedAt,
            nextEvaluationAt: userTier.nextEvaluationAt,
            benefits: {
                compRate: benefits.compRate,
                lossbackRate: benefits.lossbackRate,
                rakebackRate: benefits.rakebackRate,
                reloadBonusRate: benefits.reloadBonusRate,
                dailyWithdrawalLimitUsd: benefits.dailyWithdrawalLimitUsd,
                isWithdrawalUnlimited: benefits.isWithdrawalUnlimited,
                hasDedicatedManager: benefits.hasDedicatedManager,
                isVIPEventEligible: benefits.isVIPEventEligible,
            },
        };
    }
}
