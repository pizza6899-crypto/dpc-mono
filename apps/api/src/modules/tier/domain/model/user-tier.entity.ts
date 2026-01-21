import { Prisma } from '@prisma/client';
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
        private _totalRollingUsd: Prisma.Decimal,

        // Control
        private _highestPromotedPriority: number,
        private _isManualLock: boolean,
        private _lastPromotedAt: Date,

        // Affiliate fields
        private _affiliateCustomRate: Prisma.Decimal | null,
        private _isAffiliateCustomRate: boolean,
        private _affiliateMonthlyWagerAmount: Prisma.Decimal,

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
        totalRollingUsd?: Prisma.Decimal | number;
        highestPromotedPriority?: number;
        isManualLock?: boolean;
        lastPromotedAt?: Date;
        affiliateCustomRate?: Prisma.Decimal | null;
        isAffiliateCustomRate?: boolean;
        affiliateMonthlyWagerAmount?: Prisma.Decimal | number;
        tier?: Tier;
    }): UserTier {
        const rolling =
            params.totalRollingUsd instanceof Prisma.Decimal
                ? params.totalRollingUsd
                : new Prisma.Decimal(params.totalRollingUsd ?? 0);

        const affiliateMonthlyWager =
            params.affiliateMonthlyWagerAmount instanceof Prisma.Decimal
                ? params.affiliateMonthlyWagerAmount
                : new Prisma.Decimal(params.affiliateMonthlyWagerAmount ?? 0);

        return new UserTier(
            params.id ?? null,
            params.uid ?? generateUid(),
            params.userId,
            params.tierId,
            rolling,
            params.highestPromotedPriority ?? 0,
            params.isManualLock ?? false,
            params.lastPromotedAt ?? new Date(),
            params.affiliateCustomRate ?? null,
            params.isAffiliateCustomRate ?? false,
            affiliateMonthlyWager,
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
        totalRollingUsd: Prisma.Decimal;
        highestPromotedPriority: number;
        isManualLock: boolean;
        lastPromotedAt: Date;
        affiliateCustomRate: Prisma.Decimal | null;
        isAffiliateCustomRate: boolean;
        affiliateMonthlyWagerAmount: Prisma.Decimal;
        createdAt: Date;
        updatedAt: Date;
        tier?: Tier;
    }): UserTier {
        return new UserTier(
            data.id,
            data.uid,
            data.userId,
            data.tierId,
            data.totalRollingUsd,
            data.highestPromotedPriority,
            data.isManualLock,
            data.lastPromotedAt,
            data.affiliateCustomRate,
            data.isAffiliateCustomRate,
            data.affiliateMonthlyWagerAmount,
            data.createdAt,
            data.updatedAt,
            data.tier
        );
    }

    // Getters
    get tierId(): bigint { return this._tierId; }
    get totalRollingUsd(): Prisma.Decimal { return this._totalRollingUsd; }
    get highestPromotedPriority(): number { return this._highestPromotedPriority; }
    get isManualLock(): boolean { return this._isManualLock; }
    get lastPromotedAt(): Date { return this._lastPromotedAt; }
    get affiliateCustomRate(): Prisma.Decimal | null { return this._affiliateCustomRate; }
    get isAffiliateCustomRate(): boolean { return this._isAffiliateCustomRate; }
    get affiliateMonthlyWagerAmount(): Prisma.Decimal { return this._affiliateMonthlyWagerAmount; }

    // Business Logic

    addRolling(amount: Prisma.Decimal): void {
        if (amount.lte(0)) throw new InvalidRollingAmountException(amount.toString());
        this._totalRollingUsd = this._totalRollingUsd.add(amount);
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

        return this._totalRollingUsd.gte(targetTier.requirementUsd);
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
                `Cannot upgrade to ${targetTier.code}. Rolling ${this._totalRollingUsd} < Req ${targetTier.requirementUsd}`
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
        // Don't necessarily change totalRollingUsd, but maybe we should if requirement not met?
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

    // Affiliate Business Logic

    /**
     * 어필리에이트 월간 베팅 금액 추가
     */
    addAffiliateMonthlyWager(amount: Prisma.Decimal): void {
        if (amount.lte(0)) throw new InvalidRollingAmountException(amount.toString());
        this._affiliateMonthlyWagerAmount = this._affiliateMonthlyWagerAmount.add(amount);
    }

    /**
     * 어필리에이트 월간 베팅 금액 초기화 (월간 리셋)
     */
    resetAffiliateMonthlyWager(): void {
        this._affiliateMonthlyWagerAmount = new Prisma.Decimal(0);
    }

    /**
     * 수동 커미션 요율 설정
     */
    setAffiliateCustomRate(rate: Prisma.Decimal): void {
        this._affiliateCustomRate = rate;
        this._isAffiliateCustomRate = true;
    }

    /**
     * 수동 커미션 요율 해제 (기본 요율로 복귀)
     */
    resetAffiliateCustomRate(): void {
        this._affiliateCustomRate = null;
        this._isAffiliateCustomRate = false;
    }
}
