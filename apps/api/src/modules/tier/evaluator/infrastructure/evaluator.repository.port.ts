import { TierDemotionWarning } from '../domain/tier-demotion-warning.entity';
import { Prisma } from '@prisma/client';

export interface CreateTierDemotionWarningProps {
    userId: bigint;
    currentTierId: bigint;
    targetTierId: bigint;
    evaluationDueAt: Date;
    requiredRolling: Prisma.Decimal;
    currentRolling: Prisma.Decimal;
}

export abstract class TierDemotionWarningRepositoryPort {
    abstract findByUserId(userId: bigint): Promise<TierDemotionWarning | null>;
    abstract save(warning: TierDemotionWarning): Promise<TierDemotionWarning>;
    abstract create(props: CreateTierDemotionWarningProps): Promise<TierDemotionWarning>;
    abstract deleteByUserId(userId: bigint): Promise<void>;
    abstract findAllExpired(now: Date): Promise<TierDemotionWarning[]>;
}
