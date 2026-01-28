import { Tier } from '../domain/tier.entity';
import { TierSettings } from '../domain/tier-settings.entity';

export interface UpdateTierProps {
    id: bigint;
    requirementUsd?: number;
    requirementDepositUsd?: number;
    maintenanceRollingUsd?: number;
    evaluationCycle?: any; // TierEvaluationCycle
    levelUpBonusUsd?: number;
    levelUpBonusWageringMultiplier?: number;
    compRate?: number;
    lossbackRate?: number;
    rakebackRate?: number;
    reloadBonusRate?: number;
    dailyWithdrawalLimitUsd?: number;
    isWithdrawalUnlimited?: boolean;
    hasDedicatedManager?: boolean;
    isVIPEventEligible?: boolean;
    imageUrl?: string | null;
    translations?: {
        language: any; // Language
        name: string;
        description?: string | null;
    }[];
    updatedBy: bigint;
}

export abstract class TierRepositoryPort {
    abstract findAll(): Promise<Tier[]>;
    abstract findById(id: bigint): Promise<Tier | null>;
    abstract findByPriority(priority: number): Promise<Tier | null>;
    abstract findByCode(code: string): Promise<Tier | null>;
    abstract update(props: UpdateTierProps): Promise<Tier>;
}

export interface UpdateTierSettingsProps {
    isPromotionEnabled?: boolean;
    isDowngradeEnabled?: boolean;
    evaluationHourUtc?: number;
    updatedBy: bigint;
}

export abstract class TierSettingsRepositoryPort {
    abstract find(): Promise<TierSettings | null>;
    abstract update(props: UpdateTierSettingsProps): Promise<TierSettings>;
}
