import { Prisma } from '@prisma/client';
import { Cast, PersistenceOf } from 'src/infrastructure/persistence/persistence.util';

export type TierConfigRawPayload = Prisma.TierConfigGetPayload<object>;

export class TierConfig {
    public static readonly SINGLETON_ID = 1n;

    constructor(
        public readonly isPromotionEnabled: boolean,
        public readonly isDowngradeEnabled: boolean,
        public readonly evaluationHourUtc: number,
        public readonly updatedAt: Date,
        public readonly updatedBy: bigint | null,
    ) { }

    static fromPersistence(data: PersistenceOf<TierConfigRawPayload>): TierConfig {
        return new TierConfig(
            data.isPromotionEnabled,
            data.isDowngradeEnabled,
            data.evaluationHourUtc,
            Cast.date(data.updatedAt),
            data.updatedBy ? Cast.bigint(data.updatedBy) : null,
        );
    }
}
