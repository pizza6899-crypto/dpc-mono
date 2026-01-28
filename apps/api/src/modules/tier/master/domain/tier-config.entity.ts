import { Prisma } from '@prisma/client';

export class TierConfig {
    constructor(
        public readonly id: bigint,
        public readonly isPromotionEnabled: boolean,
        public readonly isDowngradeEnabled: boolean,
        public readonly evaluationHourUtc: number,
        public readonly updatedAt: Date,
        public readonly updatedBy: string | null,
    ) { }

    static fromPersistence(data: Prisma.TierConfigGetPayload<object>): TierConfig {
        return new TierConfig(
            data.id,
            data.isPromotionEnabled,
            data.isDowngradeEnabled,
            data.evaluationHourUtc,
            data.updatedAt,
            data.updatedBy
        );
    }
}
