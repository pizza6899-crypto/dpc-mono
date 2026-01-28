import { Prisma } from '@prisma/client';

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

    static fromPersistence(data: Prisma.TierDemotionWarningGetPayload<object>): TierDemotionWarning {
        return new TierDemotionWarning(
            data.id,
            data.userId,
            data.currentTierId,
            data.targetTierId,
            data.evaluationDueAt,
            data.requiredRolling,
            data.currentRolling,
            data.lastNotifiedAt,
        );
    }
}
