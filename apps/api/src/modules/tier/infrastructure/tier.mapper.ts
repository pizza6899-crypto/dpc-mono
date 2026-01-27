import { Injectable } from '@nestjs/common';
import { Tier as TierModel, Prisma } from '@prisma/client';
import { Tier } from '../domain';

@Injectable()
export class TierMapper {
    toDomain(model: TierModel & { translations?: { language: string; name: string }[] }): Tier {
        return Tier.fromPersistence({
            id: model.id,
            priority: model.priority,
            code: model.code,
            requirementUsd: model.requirementUsd,
            requirementDepositUsd: model.requirementDepositUsd,
            maintenanceRollingUsd: model.maintenanceRollingUsd,
            levelUpBonusUsd: model.levelUpBonusUsd,
            compRate: model.compRate,
            lossbackRate: model.lossbackRate,
            rakebackRate: model.rakebackRate,
            dailyWithdrawalLimitUsd: model.dailyWithdrawalLimitUsd,
            hasDedicatedManager: model.hasDedicatedManager,
            isVIPEventEligible: model.isVIPEventEligible,
            reloadBonusRate: model.reloadBonusRate,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            translations: model.translations?.map(t => ({
                language: t.language,
                name: t.name,
            })),
        });
    }

    toPersistence(domain: Tier): Prisma.TierUncheckedCreateInput {
        return {
            id: domain.id ?? undefined,
            priority: domain.priority,
            code: domain.code,
            requirementUsd: domain.requirementUsd,
            requirementDepositUsd: domain.requirementDepositUsd,
            maintenanceRollingUsd: domain.maintenanceRollingUsd,
            levelUpBonusUsd: domain.levelUpBonusUsd,
            compRate: domain.compRate,
            lossbackRate: domain.lossbackRate,
            rakebackRate: domain.rakebackRate,
            dailyWithdrawalLimitUsd: domain.dailyWithdrawalLimitUsd,
            hasDedicatedManager: domain.hasDedicatedManager,
            isVIPEventEligible: domain.isVIPEventEligible,
            reloadBonusRate: domain.reloadBonusRate,
            createdAt: domain.createdAt,
            updatedAt: domain.updatedAt,
        };
    }
}
