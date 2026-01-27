import { Prisma, TierDemotionWarning as PrismaTierDemotionWarning } from '@prisma/client';

export class TierDemotionWarning {
    constructor(
        public readonly id: bigint,
        public readonly userId: bigint,
        public readonly currentTierId: bigint,
        public readonly targetTierId: bigint,

        public readonly evaluationDueAt: Date,
        public readonly requiredRolling: Prisma.Decimal,
        public readonly currentRolling: Prisma.Decimal,

        public readonly lastNotifiedAt: Date | null,
    ) { }

    /**
     * Calculates the remaining rolling amount to avoid demotion.
     */
    getRemainingRolling(): Prisma.Decimal {
        const remaining = this.requiredRolling.minus(this.currentRolling);
        return remaining.isPositive() ? remaining : new Prisma.Decimal(0);
    }

    static fromPersistence(data: PrismaTierDemotionWarning): TierDemotionWarning {
        return new TierDemotionWarning(
            data.id,
            data.userId,
            data.currentTierId,
            data.targetTierId,
            data.evaluationDueAt,
            data.requiredRolling,
            data.currentRolling,
            data.lastNotifiedAt
        );
    }
}
