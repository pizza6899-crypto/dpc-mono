import { Prisma, TierChangeType, TierHistoryReferenceType, TierHistory as PrismaTierHistory } from '@prisma/client';
import { Cast } from 'src/infrastructure/persistence/persistence.util';

export class TierHistory {
    constructor(
        public readonly id: bigint,
        public readonly userId: bigint,
        public readonly fromTierId: bigint | null,
        public readonly toTierId: bigint,
        public readonly changeType: TierChangeType,
        public readonly reason: string | null,

        // Snapshot: Data at the time of change
        public readonly rollingAmountSnap: Prisma.Decimal,
        public readonly depositAmountSnap: Prisma.Decimal,
        public readonly compRateSnap: Prisma.Decimal,
        public readonly lossbackRateSnap: Prisma.Decimal,
        public readonly rakebackRateSnap: Prisma.Decimal,

        // Snapshot: Rules & Status
        public readonly requirementUsdSnap: Prisma.Decimal,
        public readonly requirementDepositUsdSnap: Prisma.Decimal,
        public readonly cumulativeDepositUsdSnap: Prisma.Decimal,

        // Bonus Info
        public readonly hasBonusGenerated: boolean,
        public readonly bonusAmountSnap: Prisma.Decimal,
        public readonly skippedReason: string | null,

        public readonly changedAt: Date,
        public readonly changeBy: string | null,

        // Audit Reference
        public readonly referenceType: TierHistoryReferenceType | null,
        public readonly referenceId: bigint | null,
    ) { }

    static fromPersistence(data: PrismaTierHistory): TierHistory {
        return new TierHistory(
            Cast.bigint(data.id),
            Cast.bigint(data.userId),
            Cast.bigint(data.fromTierId),
            Cast.bigint(data.toTierId),
            data.changeType,
            data.reason,
            Cast.decimal(data.rollingAmountSnap),
            Cast.decimal(data.depositAmountSnap),
            Cast.decimal(data.compRateSnap),
            Cast.decimal(data.lossbackRateSnap),
            Cast.decimal(data.rakebackRateSnap),
            Cast.decimal(data.requirementUsdSnap),
            Cast.decimal(data.requirementDepositUsdSnap),
            Cast.decimal(data.cumulativeDepositUsdSnap),
            data.hasBonusGenerated,
            Cast.decimal(data.bonusAmountSnap),
            data.skippedReason,
            Cast.date(data.changedAt),
            data.changeBy,
            data.referenceType,
            Cast.bigint(data.referenceId)
        );
    }
}
