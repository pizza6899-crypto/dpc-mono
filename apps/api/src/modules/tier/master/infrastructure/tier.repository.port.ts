import { TierEvaluationCycle, Language } from '@prisma/client';
import { Tier } from '../domain/tier.entity';

export interface UpdateTierProps {
    code: string;
    requirementUsd?: number;
    priority?: number;
    requirementDepositUsd?: number;
    maintenanceRollingUsd?: number;
    evaluationCycle?: TierEvaluationCycle;
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
    imageFileId?: string | null;
    translations?: {
        language: Language;
        name: string;
        description?: string | null;
    }[];
    updatedBy: bigint;
}

export abstract class TierRepositoryPort {
    abstract findAll(options?: { ignoreCache?: boolean }): Promise<Tier[]>;
    abstract findByPriority(priority: number): Promise<Tier | null>;
    abstract findByCode(code: string): Promise<Tier | null>;
    abstract findNextTierByPriority(priority: number): Promise<Tier | null>;
    abstract update(props: UpdateTierProps): Promise<Tier>;
}
