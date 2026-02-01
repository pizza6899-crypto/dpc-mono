import { Injectable } from '@nestjs/common';
import { UserTierRepositoryPort } from '../infrastructure/user-tier.repository.port';
import { RecordTierHistoryService } from '../../audit/application/record-tier-history.service';
import { TierRepositoryPort } from '../../definitions/infrastructure/tier.repository.port';
import { TierChangeType, Prisma } from '@prisma/client';
import { UserTierNotFoundException } from '../domain/tier-profile.exception';
import { TierNotFoundException } from '../../definitions/domain/tier-definitions.exception';

@Injectable()
export class ForceUpdateUserTierService {
    constructor(
        private readonly userTierRepository: UserTierRepositoryPort,
        private readonly tierRepository: TierRepositoryPort,
        private readonly recordTierHistoryService: RecordTierHistoryService,
    ) { }

    async execute(userId: bigint, targetTierId: bigint, reason: string): Promise<void> {
        const userTier = await this.userTierRepository.findByUserId(userId);
        if (!userTier || !userTier.tier) {
            throw new UserTierNotFoundException();
        }

        const targetTier = (await this.tierRepository.findAll()).find(t => t.id === targetTierId);
        if (!targetTier) {
            throw new TierNotFoundException();
        }

        const oldTierId = userTier.tierId;

        // [Manual Update] 수동 업데이트는 승급 보너스 지급 로직을 타지 않도록 처리하거나 별도 정책을 따름
        // 여기서는 단순 티어 이동(upgradeTier)을 호출하되 보너스 관련 반환값은 무시합니다.
        userTier.upgradeTier(targetTierId, targetTier.level);
        await this.userTierRepository.save(userTier);

        await this.recordTierHistoryService.execute({
            userId,
            fromTierId: oldTierId,
            toTierId: targetTierId,
            changeType: TierChangeType.MANUAL_UPDATE,
            reason: `Admin Force Update: ${reason}`,
            statusRollingUsdSnap: userTier.statusRollingUsd,
            currentPeriodDepositUsdSnap: userTier.currentPeriodDepositUsd,
            compRateSnap: userTier.customCompRate ?? targetTier.compRate,
            weeklyLossbackRateSnap: userTier.customWeeklyLossbackRate ?? targetTier.weeklyLossbackRate,
            monthlyLossbackRateSnap: userTier.customMonthlyLossbackRate ?? targetTier.monthlyLossbackRate,
            upgradeRollingRequiredUsdSnap: targetTier.upgradeRollingRequiredUsd,
            upgradeDepositRequiredUsdSnap: targetTier.upgradeDepositRequiredUsd,
            lifetimeRollingUsdSnap: userTier.lifetimeRollingUsd,
            lifetimeDepositUsdSnap: userTier.lifetimeDepositUsd,
            hasBonusGenerated: false,
            bonusAmountUsdSnap: new Prisma.Decimal(0),
        });
    }
}
