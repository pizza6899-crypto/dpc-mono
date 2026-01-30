import { TierSettings } from '../domain/tier-settings.entity';

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
