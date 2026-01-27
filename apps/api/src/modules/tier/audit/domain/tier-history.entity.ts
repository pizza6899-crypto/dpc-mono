import { Prisma, TierChangeType, TierHistoryReferenceType } from '@prisma/client';

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
        public readonly compRateSnap: Prisma.Decimal,
        public readonly lossbackRateSnap: Prisma.Decimal,
        public readonly rakebackRateSnap: Prisma.Decimal,

        // Snapshot: Rules & Status
        public readonly requirementUsdSnap: Prisma.Decimal,
        public readonly requirementDepositUsdSnap: Prisma.Decimal,
        public readonly cumulativeDepositUsdSnap: Prisma.Decimal,

        // Bonus Info
        public readonly bonusAmount: Prisma.Decimal | null,
        public readonly skippedBonusAmount: Prisma.Decimal | null,
        public readonly skippedReason: string | null,

        public readonly changedAt: Date,
        public readonly changeBy: string | null,

        // Audit Reference
        public readonly referenceType: TierHistoryReferenceType | null,
        public readonly referenceId: bigint | null,
    ) { }

    static fromPersistence(data: any): TierHistory {
        return new TierHistory(
            data.id,
            data.userId,
            data.fromTierId,
            data.toTierId,
            data.changeType as TierChangeType,
            data.reason,
            data.rollingAmountSnap,
            data.compRateSnap,
            data.lossbackRateSnap,
            data.rakebackRateSnap,
            data.requirementUsdSnap,
            data.requirementDepositUsdSnap,
            data.cumulativeDepositUsdSnap,
            data.bonusAmount,
            data.skippedBonusAmount,
            data.skippedReason,
            data.changedAt,
            data.changeBy,
            data.referenceType as TierHistoryReferenceType,
            data.referenceId
        );
    }
}
