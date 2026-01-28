import { Prisma } from '@prisma/client';

export class TierSettings {
    public static readonly SINGLETON_ID = 1n;

    constructor(
        public readonly isPromotionEnabled: boolean,
        public readonly isDowngradeEnabled: boolean,
        public readonly evaluationHourUtc: number,
        public readonly updatedAt: Date,
        public readonly updatedBy: bigint | null,
    ) { }

    static fromPersistence(data: Prisma.TierConfigGetPayload<object>): TierSettings {
        return new TierSettings(
            data.isPromotionEnabled,
            data.isDowngradeEnabled,
            data.evaluationHourUtc,
            data.updatedAt,
            // @ts-ignore: Prisma Client type sync lag (Schema is BigInt)
            data.updatedBy
        );
    }
}
