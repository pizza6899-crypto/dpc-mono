import { TierConfig } from '../domain/tier-config.entity';

export interface UpdateTierConfigProps {
    isPromotionEnabled?: boolean;
    isDowngradeEnabled?: boolean;
    evaluationHourUtc?: number;
    updatedBy: bigint;
}

export abstract class TierConfigRepositoryPort {
    abstract find(): Promise<TierConfig | null>;
    abstract update(props: UpdateTierConfigProps): Promise<TierConfig>;
}
