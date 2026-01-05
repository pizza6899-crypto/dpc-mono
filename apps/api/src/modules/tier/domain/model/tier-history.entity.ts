import { Prisma } from '@repo/database';
import { generateUid } from 'src/utils/id.util';

export enum TierChangeType {
    INITIAL = 'INITIAL',
    UPGRADE = 'UPGRADE',
    DOWNGRADE = 'DOWNGRADE',
    MANUAL_UPDATE = 'MANUAL_UPDATE',
}

/**
 * Tier History Entity
 * Logs every change in user tier for audit and tracking.
 */
export class TierHistory {
    private constructor(
        public readonly id: bigint | null,
        public readonly uid: string,
        public readonly userId: bigint,
        public readonly fromTierId: bigint | null,
        public readonly toTierId: bigint,
        public readonly changeType: TierChangeType,
        public readonly reason: string, // 'Start', 'Auto Promotion', 'Admin Manual'
        public readonly rollingSnapshot: Prisma.Decimal, // Rolling amount at the time of change
        public readonly bonusAmount: Prisma.Decimal, // Bonus awarded (if any)
        public readonly createdAt: Date,
    ) { }

    static create(params: {
        id?: bigint;
        uid?: string;
        userId: bigint;
        fromTierId?: bigint | null;
        toTierId: bigint;
        changeType: TierChangeType;
        reason?: string;
        rollingSnapshot: Prisma.Decimal | number;
        bonusAmount?: Prisma.Decimal | number;
    }): TierHistory {
        const rolling = params.rollingSnapshot instanceof Prisma.Decimal
            ? params.rollingSnapshot
            : new Prisma.Decimal(params.rollingSnapshot);

        const bonus = params.bonusAmount instanceof Prisma.Decimal
            ? params.bonusAmount
            : new Prisma.Decimal(params.bonusAmount ?? 0);

        return new TierHistory(
            params.id ?? null,
            params.uid ?? generateUid(),
            params.userId,
            params.fromTierId ?? null,
            params.toTierId,
            params.changeType,
            params.reason ?? 'Auto Update',
            rolling,
            bonus,
            new Date()
        );
    }

    static fromPersistence(data: {
        id: bigint;
        uid: string;
        userId: bigint;
        fromTierId: bigint | null;
        toTierId: bigint;
        changeType: TierChangeType; // or string and cast
        reason: string;
        rollingSnapshot: Prisma.Decimal;
        bonusAmount: Prisma.Decimal;
        createdAt: Date;
    }): TierHistory {
        return new TierHistory(
            data.id,
            data.uid,
            data.userId,
            data.fromTierId,
            data.toTierId,
            data.changeType,
            data.reason,
            data.rollingSnapshot,
            data.bonusAmount,
            data.createdAt
        );
    }
}
