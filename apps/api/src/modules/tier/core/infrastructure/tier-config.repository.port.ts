import { TierConfig } from '../../domain/tier-config.entity';

export const TIER_CONFIG_REPOSITORY = Symbol('TIER_CONFIG_REPOSITORY');

export interface TierConfigRepositoryPort {
    find(): Promise<TierConfig | null>;
    save(config: TierConfig): Promise<TierConfig>;
}
