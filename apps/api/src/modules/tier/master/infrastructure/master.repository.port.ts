import { Tier } from '../domain/tier.entity';
import { TierConfig } from '../domain/tier-config.entity';

export abstract class TierRepositoryPort {
    abstract findAll(): Promise<Tier[]>;
    abstract findById(id: bigint): Promise<Tier | null>;
    abstract findByPriority(priority: number): Promise<Tier | null>;
    abstract findByCode(code: string): Promise<Tier | null>;
}

export interface UpdateTierConfigProps {
    isPromotionEnabled?: boolean;
    isDowngradeEnabled?: boolean;
    evaluationHourUtc?: number;
    updatedBy: string;
}

export abstract class TierConfigRepositoryPort {
    abstract find(): Promise<TierConfig | null>;
    abstract update(props: UpdateTierConfigProps): Promise<TierConfig>;
}
