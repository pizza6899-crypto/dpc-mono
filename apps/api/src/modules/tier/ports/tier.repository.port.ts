import { Tier } from "../domain";

export interface TierRepositoryPort {
    findAll(): Promise<Tier[]>;
    findByCode(code: string): Promise<Tier | null>;
    findByPriority(priority: number): Promise<Tier | null>;
    findById(id: bigint): Promise<Tier | null>;

    // Admin / Init
    // Admin / Init
    create(tier: Tier): Promise<Tier>;
    update(tier: Tier): Promise<Tier>;
    acquireGlobalLock(): Promise<void>;
    // delete? usually hard to delete tiers if users are assigned. keep it simple for now.
}
