import { Prisma } from '@prisma/client';
import { Cast, PersistenceOf } from 'src/infrastructure/persistence/persistence.util';

export type TierConfigRawPayload = Prisma.TierConfigGetPayload<object>;

export class TierConfig {
    public static readonly SINGLETON_ID = 1n;

    constructor(
        public readonly isPromotionEnabled: boolean,
        public readonly isDowngradeEnabled: boolean,
        public readonly isBonusEnabled: boolean,
        public readonly defaultGracePeriodDays: number,
        public readonly triggerIntervalMinutes: number,
        public readonly updatedAt: Date,
        public readonly updatedBy: bigint | null,
    ) { }

    static fromPersistence(data: PersistenceOf<TierConfigRawPayload>): TierConfig {
        return new TierConfig(
            data.isPromotionEnabled,
            data.isDowngradeEnabled,
            data.isBonusEnabled,
            data.defaultGracePeriodDays,
            data.triggerIntervalMinutes,
            new Date(data.updatedAt),
            data.updatedBy ? BigInt(data.updatedBy.toString()) : null,
        );
    }
}
