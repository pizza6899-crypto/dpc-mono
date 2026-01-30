import { Prisma } from '@prisma/client';
import { Cast, PersistenceOf } from 'src/infrastructure/persistence/persistence.util';

export type TierSettingsRawPayload = Prisma.TierConfigGetPayload<object>;

export class TierSettings {
    public static readonly SINGLETON_ID = 1n;

    constructor(
        public readonly isPromotionEnabled: boolean,
        public readonly isDowngradeEnabled: boolean,
        public readonly evaluationHourUtc: number,
        public readonly updatedAt: Date,
        public readonly updatedBy: bigint | null,
    ) { }

    static fromPersistence(data: PersistenceOf<TierSettingsRawPayload>): TierSettings {
        return new TierSettings(
            data.isPromotionEnabled,
            data.isDowngradeEnabled,
            data.evaluationHourUtc,
            Cast.date(data.updatedAt),
            data.updatedBy ? Cast.bigint(data.updatedBy) : null,
        );
    }
}
