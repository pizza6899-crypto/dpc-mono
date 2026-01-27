import { Tier } from '../../domain/tier.entity';

export const TIER_REPOSITORY = Symbol('TIER_REPOSITORY');

export interface TierRepositoryPort {
    findAll(): Promise<Tier[]>;
    findById(id: bigint): Promise<Tier | null>;
    findByCode(code: string): Promise<Tier | null>;
}
