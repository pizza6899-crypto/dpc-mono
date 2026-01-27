import { Tier } from '../domain/tier.entity';
import { TierConfig } from '../domain/tier-config.entity';

export abstract class TierRepositoryPort {
    abstract findAll(): Promise<Tier[]>;
    abstract findById(id: bigint): Promise<Tier | null>;
}

export abstract class TierConfigRepositoryPort {
    abstract find(): Promise<TierConfig | null>;
}
