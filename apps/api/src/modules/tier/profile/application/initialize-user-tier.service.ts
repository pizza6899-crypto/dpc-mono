import { Injectable } from '@nestjs/common';
import { UserTierRepositoryPort } from '../infrastructure/user-tier.repository.port';
import { TierRepositoryPort } from '../../master/infrastructure/tier.repository.port';
import { UserTier } from '../domain/user-tier.entity';
import { Prisma, UserTierStatus, TierEvaluationCycle, TierChangeType } from '@prisma/client';
import { RecordTierHistoryService } from '../../audit/application/record-tier-history.service';
import { Transactional } from '@nestjs-cls/transactional';

@Injectable()
export class InitializeUserTierService {
    constructor(
        private readonly userTierRepository: UserTierRepositoryPort,
        private readonly tierRepository: TierRepositoryPort,
        private readonly recordTierHistoryService: RecordTierHistoryService,
    ) { }

    @Transactional()
    async execute(userId: bigint): Promise<UserTier> {
        const existing = await this.userTierRepository.findByUserId(userId);
        if (existing) return existing;

        const allTiers = await this.tierRepository.findAll();
        // findAll()은 이미 level ASC로 정렬되어 있으므로 [0]이 최하위 기초 티어입니다.
        const baseTier = allTiers[0];
        if (!baseTier) throw new Error('Tier definitions missing');

        // 티어 주기에 따른 초기 심사일 계산
        const nextEvaluationAt = this.calculateNextEvaluationAt(baseTier.evaluationCycle);

        const newUserTier = new UserTier(
            0n,
            userId,
            baseTier.id,
            // States (초기화)
            new Prisma.Decimal(0), // lifetimeRollingUsd
            new Prisma.Decimal(0), // statusRollingUsd
            new Prisma.Decimal(0), // currentPeriodRollingUsd
            new Prisma.Decimal(0), // lifetimeDepositUsd
            new Prisma.Decimal(0), // currentPeriodDepositUsd
            new Date(),            // lastEvaluationAt
            // 승급/강등 제어
            baseTier.level,        // currentLevel
            baseTier.level,        // maxLevelAchieved
            null,                  // lastBonusReceivedAt
            UserTierStatus.ACTIVE, // status
            null,                  // downgradeGracePeriodEndsAt
            new Date(),            // lastTierChangedAt
            null,                  // lastUpgradeAt (초기화 시점이므로 null)
            null,                  // lastDowngradeAt
            // Overrides
            null,                  // customCompRate
            null,                  // customWeeklyLossbackRate
            null,                  // customMonthlyLossbackRate
            null,                  // customWithdrawalLimitUsd
            null,                  // isCustomWithdrawalUnlimited
            null,                  // isCustomDedicatedManager
            // Audit & Misc
            null,                  // note
            true,                  // isBonusEligible
            nextEvaluationAt,      // nextEvaluationAt
            // Warning State
            null,                  // downgradeWarningIssuedAt
            null,                  // downgradeWarningTargetTierId
            baseTier               // Joined Tier data
        );

        const savedUserTier = await this.userTierRepository.save(newUserTier);

        // 초기 티어 할당 이력 기록
        await this.recordTierHistoryService.execute({
            userId,
            fromTierId: null,
            toTierId: baseTier.id,
            changeType: TierChangeType.INITIAL,
            reason: 'User initialized with base tier',
            statusRollingUsdSnap: new Prisma.Decimal(0),
            currentPeriodDepositUsdSnap: new Prisma.Decimal(0),
            compRateSnap: baseTier.compRate,
            weeklyLossbackRateSnap: baseTier.weeklyLossbackRate,
            monthlyLossbackRateSnap: baseTier.monthlyLossbackRate,
            upgradeRollingRequiredUsdSnap: baseTier.upgradeRollingRequiredUsd,
            upgradeDepositRequiredUsdSnap: baseTier.upgradeDepositRequiredUsd,
            lifetimeRollingUsdSnap: new Prisma.Decimal(0),
            lifetimeDepositUsdSnap: new Prisma.Decimal(0),
            hasBonusGenerated: false,
            bonusAmountUsdSnap: new Prisma.Decimal(0),
        });

        return savedUserTier;
    }

    private calculateNextEvaluationAt(cycle: TierEvaluationCycle): Date | null {
        const now = new Date();
        switch (cycle) {
            case TierEvaluationCycle.ROLLING_30_DAYS:
                now.setUTCDate(now.getUTCDate() + 30);
                return now;
            case TierEvaluationCycle.ROLLING_90_DAYS:
                now.setUTCDate(now.getUTCDate() + 90);
                return now;
            case TierEvaluationCycle.NONE:
                return null;
            default:
                // 기본값 30일
                now.setUTCDate(now.getUTCDate() + 30);
                return now;
        }
    }
}
