import { TierEvaluationCycle, Language } from '@prisma/client';
import { Tier } from '../domain/tier.entity';

export interface UpdateTierProps {
    code: string;
    level?: number;
    upgradeRollingRequiredUsd?: number;
    upgradeDepositRequiredUsd?: number;
    maintainRollingRequiredUsd?: number;
    evaluationCycle?: TierEvaluationCycle;
    upgradeBonusUsd?: number;
    upgradeBonusWageringMultiplier?: number;
    rewardExpiryDays?: number | null;
    isImmediateBonusEnabled?: boolean;
    compRate?: number;
    weeklyLossbackRate?: number;
    monthlyLossbackRate?: number;
    dailyWithdrawalLimitUsd?: number;
    isWithdrawalUnlimited?: boolean;
    hasDedicatedManager?: boolean;
    isActive?: boolean;
    isHidden?: boolean;
    isManualOnly?: boolean;
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
    abstract findByLevel(level: number): Promise<Tier | null>;
    abstract findByCode(code: string): Promise<Tier | null>;
    abstract findNextTierByLevel(level: number): Promise<Tier | null>;
    abstract update(props: UpdateTierProps): Promise<Tier>;
}
