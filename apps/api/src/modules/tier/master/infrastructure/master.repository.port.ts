import { Tier } from '../domain/tier.entity';
import { TierSettings } from '../domain/tier-settings.entity';

export abstract class TierRepositoryPort {
    abstract findAll(): Promise<Tier[]>;
    abstract findById(id: bigint): Promise<Tier | null>;
    abstract findByPriority(priority: number): Promise<Tier | null>;
    abstract findByCode(code: string): Promise<Tier | null>;
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
