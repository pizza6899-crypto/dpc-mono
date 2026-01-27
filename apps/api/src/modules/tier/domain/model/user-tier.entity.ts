import { Prisma } from '@prisma/client';
import { Tier } from './tier.entity';
import { InvalidRollingAmountException, TierException } from '../tier.exception';

/**
 * UserTier Entity
 * Maps user to a specific tier and tracks their rolling progress.
 */
export class UserTier {
    private constructor(
        public readonly id: bigint | null,
        public readonly userId: bigint,
        private _tierId: bigint,

        // Status
        private _cumulativeRollingUsd: Prisma.Decimal,
        private _currentPeriodRollingUsd: Prisma.Decimal,
        private _evaluationDate: Date,

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
        userId: bigint;
        tierId: bigint;
        cumulativeRollingUsd?: Prisma.Decimal | number;
        currentPeriodRollingUsd?: Prisma.Decimal | number;
        evaluationDate?: Date;
        highestPromotedPriority?: number;
        isManualLock?: boolean;
        lastPromotedAt?: Date;
        tier?: Tier;
    }): UserTier {
        const toDecimal = (val: Prisma.Decimal | number | undefined, df = 0) =>
            val instanceof Prisma.Decimal ? val : new Prisma.Decimal(val ?? df);

        return new UserTier(
            params.id ?? null,
            params.userId,
            params.tierId,
            toDecimal(params.cumulativeRollingUsd),
            toDecimal(params.currentPeriodRollingUsd),
            params.evaluationDate ?? new Date(),
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
        userId: bigint;
        tierId: bigint;
        cumulativeRollingUsd: Prisma.Decimal;
        currentPeriodRollingUsd: Prisma.Decimal;
        evaluationDate: Date;
        highestPromotedPriority: number;
        isManualLock: boolean;
        lastPromotedAt: Date;
        createdAt: Date;
        updatedAt: Date;
        tier?: Tier;
    }): UserTier {
        return new UserTier(
            data.id,
            data.userId,
            data.tierId,
            data.cumulativeRollingUsd,
            data.currentPeriodRollingUsd,
            data.evaluationDate,
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
    get currentPeriodRollingUsd(): Prisma.Decimal { return this._currentPeriodRollingUsd; }
    get evaluationDate(): Date { return this._evaluationDate; }
    get highestPromotedPriority(): number { return this._highestPromotedPriority; }
    get isManualLock(): boolean { return this._isManualLock; }
    get lastPromotedAt(): Date { return this._lastPromotedAt; }

    // Business Logic

    addRolling(amount: Prisma.Decimal): void {
        if (amount.lte(0)) throw new InvalidRollingAmountException(amount.toString());
        this._cumulativeRollingUsd = this._cumulativeRollingUsd.add(amount);
        this._currentPeriodRollingUsd = this._currentPeriodRollingUsd.add(amount);
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

    forceChangeTier(targetTier: Tier, shouldLock: boolean): void {
        if (!targetTier.id) throw new TierException(`Cannot change to invalid tier: ${targetTier.code}`);

        this._tierId = targetTier.id;
        this._isManualLock = shouldLock;
        // Don't necessarily change cumulativeRollingUsd, but maybe we should if requirement not met?
        // User requested "force set", implying override.
        // We preserve rolling amount unless explicitly asked (not in requirements yet).

        // Update highest priority if this is a promotion
        if (targetTier.priority > this._highestPromotedPriority) {
            this._highestPromotedPriority = targetTier.priority;
            // Also update lastPromotedAt? Yes.
            this._lastPromotedAt = new Date();
        }
    }

    unlock(): void {
        this._isManualLock = false;
    }
}
