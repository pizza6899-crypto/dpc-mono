import { Injectable, NotFoundException } from '@nestjs/common';
import { UserTierRepositoryPort } from '../infrastructure/user-tier.repository.port';
import { TierAuditService } from '../../audit/application/tier-audit.service';
import { TierRepositoryPort } from '../../master/infrastructure/master.repository.port';
import { TierChangeType } from '@prisma/client';

@Injectable()
export class ForceUpdateUserTierService {
    constructor(
        private readonly userTierRepository: UserTierRepositoryPort,
        private readonly tierRepository: TierRepositoryPort,
        private readonly tierAuditService: TierAuditService,
    ) { }

    async execute(userId: bigint, targetTierId: bigint, reason: string): Promise<void> {
        const userTier = await this.userTierRepository.findByUserId(userId);
        if (!userTier || !userTier.tier) {
            throw new NotFoundException('User tier info not found');
        }

        const targetTier = (await this.tierRepository.findAll()).find(t => t.id === targetTierId);
        if (!targetTier) {
            throw new NotFoundException('Target tier not found');
        }

        const oldTierId = userTier.tierId;
        userTier.updateTier(targetTierId, targetTier.priority);
        await this.userTierRepository.save(userTier);

        await this.tierAuditService.recordTierChange({
            userId,
            fromTierId: oldTierId,
            toTierId: targetTierId,
            changeType: TierChangeType.MANUAL_UPDATE,
            reason: `Admin Force Update: ${reason}`,
            rollingAmountSnap: userTier.currentPeriodRollingUsd,
            depositAmountSnap: userTier.currentPeriodDepositUsd,
            compRateSnap: userTier.customCompRate ?? targetTier.compRate,
            lossbackRateSnap: userTier.customLossbackRate ?? targetTier.lossbackRate,
            rakebackRateSnap: userTier.customRakebackRate ?? targetTier.rakebackRate,
            requirementUsdSnap: targetTier.requirementUsd,
            requirementDepositUsdSnap: targetTier.requirementDepositUsd,
            cumulativeDepositUsdSnap: userTier.currentPeriodDepositUsd,
        });
    }
}
