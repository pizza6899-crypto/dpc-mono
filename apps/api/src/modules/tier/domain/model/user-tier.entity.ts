import { Prisma } from '@repo/database';
import { generateUid } from 'src/utils/id.util';
import { Tier } from './tier.entity';
import { InvalidRollingAmountException, TierException } from '../tier.exception';

/**
 * UserTier Entity
 * Maps user to a specific tier and tracks their rolling progress.
 */
export class UserTier {
    private constructor(
        public readonly id: bigint | null,
        public readonly uid: string,
        public readonly userId: bigint,
        private _tierId: bigint,

        // Status
        private _cumulativeRollingUsd: Prisma.Decimal,

        // Control
        private _highestPromotedPriority: number,
        private _isManualLock: boolean,
        private _lastPromotedAt: Date,

        public readonly createdAt: Date,
        public readonly updatedAt: Date,

        // Joined
        public readonly tier?: Tier,
    ) { }

    static create(params: {
        id?: bigint;
        uid?: string;
        userId: bigint;
        tierId: bigint;
        cumulativeRollingUsd?: Prisma.Decimal | number;
        highestPromotedPriority?: number;
        isManualLock?: boolean;
        lastPromotedAt?: Date;
        tier?: Tier;
    }): UserTier {
        const rolling =
            params.cumulativeRollingUsd instanceof Prisma.Decimal
                ? params.cumulativeRollingUsd
                : new Prisma.Decimal(params.cumulativeRollingUsd ?? 0);

        return new UserTier(
            params.id ?? null,
            params.uid ?? generateUid(),
            params.userId,
            params.tierId,
            rolling,
            params.highestPromotedPriority ?? 0,
            params.isManualLock ?? false,
            params.lastPromotedAt ?? new Date(),
            new Date(),
            new Date(),
            params.tier
        );
    }

    static fromPersistence(data: {
        id: bigint;
        uid: string;
        userId: bigint;
        tierId: bigint;
        cumulativeRollingUsd: Prisma.Decimal;
        highestPromotedPriority: number;
        isManualLock: boolean;
        lastPromotedAt: Date;
        createdAt: Date;
        updatedAt: Date;
        tier?: Tier;
    }): UserTier {
        return new UserTier(
            data.id,
            data.uid,
            data.userId,
            data.tierId,
            data.cumulativeRollingUsd,
            data.highestPromotedPriority,
            data.isManualLock,
            data.lastPromotedAt,
            data.createdAt,
            data.updatedAt,
            data.tier
        );
    }

    // Getters
    get tierId(): bigint { return this._tierId; }
    get cumulativeRollingUsd(): Prisma.Decimal { return this._cumulativeRollingUsd; }
    get highestPromotedPriority(): number { return this._highestPromotedPriority; }
    get isManualLock(): boolean { return this._isManualLock; }
    get lastPromotedAt(): Date { return this._lastPromotedAt; }

    // Business Logic

    addRolling(amount: Prisma.Decimal): void {
        if (amount.lte(0)) throw new InvalidRollingAmountException(amount.toString());
        this._cumulativeRollingUsd = this._cumulativeRollingUsd.add(amount);
    }

    /**
     * Check if upgrade is possible.
     * - Must satisfy rolling requirement
     * - Must be a higher priority tier
     * - Must not be manually locked (unless forceOverride is true)
     */
    canUpgradeTo(targetTier: Tier, forceOverride = false): boolean {
        if (this._isManualLock && !forceOverride) return false;

        // Ensure accurate priority comparison if current tier loaded
        if (this.tier && targetTier.priority <= this.tier.priority) return false;

        return this._cumulativeRollingUsd.gte(targetTier.requirementUsd);
    }

    /**
     * Perform upgrade logic.
     * WARNING: This only updates the memory state. 
     * Caller is responsible for persistence and History creation.
     */
    upgradeTo(targetTier: Tier): void {
        if (!targetTier.id) {
            throw new TierException(`Cannot upgrade to invalid tier: ${targetTier.code} (ID missing)`);
        }

        if (!this.canUpgradeTo(targetTier, true)) { // Internal check
            // You might throw or just return. Throwing is safer for logic enforcement.
            throw new InvalidRollingAmountException(
                `Cannot upgrade to ${targetTier.code}. Rolling ${this._cumulativeRollingUsd} < Req ${targetTier.requirementUsd}`
            );
        }

        this._tierId = targetTier.id;
        this._lastPromotedAt = new Date(); // Update promotion time

        // Update highest priority tracked if this is a new peak
        if (targetTier.priority > this._highestPromotedPriority) {
            this._highestPromotedPriority = targetTier.priority;
        }
    }

    /**
     * Check if user is eligible for level up bonus.
     * - Must be a new highest priority reached
     */
    isEligibleForLevelUpBonus(targetTier: Tier): boolean {
        return targetTier.priority > this._highestPromotedPriority;
    }
}
