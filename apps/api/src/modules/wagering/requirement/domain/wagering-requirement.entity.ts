import { Prisma } from '@prisma/client';
import type {
    ExchangeCurrencyCode,
    WageringSourceType,
    WageringStatus,
    WageringCancellationReason
} from '@prisma/client';
import { WageringAppliedConfig } from './wagering-applied-config';

export class WageringRequirement {
    private constructor(
        public readonly id: bigint,
        public readonly userId: bigint,
        public readonly currency: ExchangeCurrencyCode,
        public readonly sourceType: WageringSourceType,
        public readonly sourceId: bigint,
        private _requiredAmount: Prisma.Decimal,
        private _fulfilledAmount: Prisma.Decimal,
        private _isAutoCancelable: boolean,
        public readonly principalAmount: Prisma.Decimal,
        public readonly multiplier: Prisma.Decimal,
        public readonly initialLockedCash: Prisma.Decimal,
        public readonly grantedBonusAmount: Prisma.Decimal,
        public readonly parentWageringId: bigint | null,
        public readonly appliedConfig: WageringAppliedConfig,
        private _maxCashConversion: Prisma.Decimal | null,
        private _convertedAmount: Prisma.Decimal | null,
        private _isPaused: boolean,
        private _status: WageringStatus,
        public readonly priority: number,
        public readonly createdAt: Date,
        private _updatedAt: Date,
        public readonly expiresAt: Date | null,
        private _lastContributedAt: Date | null,
        private _completedAt: Date | null,
        private _cancelledAt: Date | null,
        private _cancellationNote: string | null,
        private _cancellationReasonType: WageringCancellationReason | null,
        private _cancelledBy: string | null,
        private _balanceAtCancellation: Prisma.Decimal | null,
        private _forfeitedAmount: Prisma.Decimal | null,
    ) { }

    // Getters
    get requiredAmount(): Prisma.Decimal { return this._requiredAmount; }
    get fulfilledAmount(): Prisma.Decimal { return this._fulfilledAmount; }
    get isAutoCancelable(): boolean { return this._isAutoCancelable; }
    get maxCashConversion(): Prisma.Decimal | null { return this._maxCashConversion; }
    get convertedAmount(): Prisma.Decimal | null { return this._convertedAmount; }
    get isPaused(): boolean { return this._isPaused; }
    get status(): WageringStatus { return this._status; }
    get updatedAt(): Date { return this._updatedAt; }
    get lastContributedAt(): Date | null { return this._lastContributedAt; }
    get completedAt(): Date | null { return this._completedAt; }
    get cancelledAt(): Date | null { return this._cancelledAt; }
    get cancellationNote(): string | null { return this._cancellationNote; }
    get cancellationReasonType(): WageringCancellationReason | null { return this._cancellationReasonType; }
    get cancelledBy(): string | null { return this._cancelledBy; }
    get balanceAtCancellation(): Prisma.Decimal | null { return this._balanceAtCancellation; }
    get forfeitedAmount(): Prisma.Decimal | null { return this._forfeitedAmount; }

    get remainingAmount(): Prisma.Decimal {
        const remaining = this._requiredAmount.sub(this._fulfilledAmount);
        return remaining.isNeg() ? new Prisma.Decimal('0') : remaining;
    }

    get isCompleted(): boolean {
        return this._status === 'COMPLETED';
    }

    get isExpired(): boolean {
        return this.expiresAt !== null && this.expiresAt < new Date();
    }

    /**
     * 롤링 조건(요구 금액)을 모두 충족했는지 여부
     */
    get isFulfilled(): boolean {
        return this._fulfilledAmount.greaterThanOrEqualTo(this._requiredAmount);
    }

    get isActive(): boolean {
        return this._status === 'ACTIVE' && !this._isPaused && !this.isExpired;
    }

    /**
     * 베팅 금액을 기여하고 실제 기여된 금액을 반환합니다.
     */
    contribute(contributionAmount: Prisma.Decimal): Prisma.Decimal {
        if (!this.isActive) {
            return new Prisma.Decimal(0);
        }

        const remaining = this.remainingAmount;
        const actualContribution = contributionAmount.greaterThan(remaining)
            ? remaining
            : contributionAmount;

        this._fulfilledAmount = this._fulfilledAmount.add(actualContribution);
        this._lastContributedAt = new Date();
        this._updatedAt = new Date();

        return actualContribution;
    }

    pause(): void {
        this._isPaused = true;
        this._updatedAt = new Date();
    }

    resume(): void {
        this._isPaused = false;
        this._updatedAt = new Date();
    }

    complete(finalBalance?: Prisma.Decimal): void {
        if (this._status !== 'ACTIVE') return;

        this._status = 'COMPLETED';
        this._completedAt = new Date();
        this._updatedAt = new Date();

        // 현금 전환 로직
        if (finalBalance && this._maxCashConversion) {
            this._convertedAmount = finalBalance.greaterThan(this._maxCashConversion)
                ? this._maxCashConversion
                : finalBalance;
        } else if (finalBalance) {
            this._convertedAmount = finalBalance;
        }
    }

    cancel(params: {
        reason: WageringCancellationReason;
        note?: string;
        cancelledBy?: string;
        balanceAtCancellation?: Prisma.Decimal;
        forfeitedAmount?: Prisma.Decimal;
    }): void {
        if (this._status !== 'ACTIVE') return;

        this._status = 'CANCELLED';
        this._cancelledAt = new Date();
        this._updatedAt = new Date();
        this._cancellationReasonType = params.reason;
        this._cancellationNote = params.note || null;
        this._cancelledBy = params.cancelledBy || 'SYSTEM';
        this._balanceAtCancellation = params.balanceAtCancellation || null;
        this._forfeitedAmount = params.forfeitedAmount || null;
    }

    void(note?: string, cancelledBy?: string): void {
        this._status = 'VOIDED';
        this._cancelledAt = new Date();
        this._updatedAt = new Date();
        this._cancellationReasonType = 'SYSTEM_ERROR';
        this._cancellationNote = note || null;
        this._cancelledBy = cancelledBy || 'SYSTEM';
    }

    expire(): void {
        if (this._status !== 'ACTIVE') return;

        this._status = 'EXPIRED';
        this._cancelledAt = new Date();
        this._updatedAt = new Date();
        this._cancellationReasonType = 'EXPIRED';
        this._cancelledBy = 'SYSTEM';
    }

    static create(params: {
        id: bigint;
        userId: bigint;
        currency: ExchangeCurrencyCode;
        sourceType: WageringSourceType;
        sourceId: bigint;
        requiredAmount: Prisma.Decimal;
        principalAmount: Prisma.Decimal;
        multiplier: Prisma.Decimal;
        initialLockedCash: Prisma.Decimal;
        grantedBonusAmount: Prisma.Decimal;
        parentWageringId?: bigint | null;
        initialFulfilledAmount?: Prisma.Decimal;
        isAutoCancelable?: boolean;
        maxCashConversion?: Prisma.Decimal | null;
        appliedConfig?: WageringAppliedConfig;
        priority?: number;
        expiresAt?: Date | null;
    }): WageringRequirement {
        return new WageringRequirement(
            params.id,
            params.userId,
            params.currency,
            params.sourceType,
            params.sourceId,
            params.requiredAmount,
            params.initialFulfilledAmount ?? new Prisma.Decimal(0),
            params.isAutoCancelable ?? true,
            params.principalAmount,
            params.multiplier,
            params.initialLockedCash,
            params.grantedBonusAmount,
            params.parentWageringId ?? null,
            params.appliedConfig ?? {},
            params.maxCashConversion ?? null,
            null,
            false,
            'ACTIVE',
            params.priority ?? 0,
            new Date(),
            new Date(),
            params.expiresAt ?? null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
        );
    }

    static fromPersistence(data: {
        id: bigint;
        userId: bigint;
        currency: ExchangeCurrencyCode;
        sourceType: WageringSourceType;
        sourceId: bigint;
        requiredAmount: Prisma.Decimal;
        fulfilledAmount: Prisma.Decimal;
        isAutoCancelable: boolean;
        principalAmount: Prisma.Decimal;
        multiplier: Prisma.Decimal;
        initialLockedCash: Prisma.Decimal;
        grantedBonusAmount: Prisma.Decimal;
        parentWageringId: bigint | null;
        appliedConfig: WageringAppliedConfig;
        maxCashConversion: Prisma.Decimal | null;
        convertedAmount: Prisma.Decimal | null;
        isPaused: boolean;
        status: WageringStatus;
        priority: number;
        createdAt: Date;
        updatedAt: Date;
        expiresAt: Date | null;
        lastContributedAt: Date | null;
        completedAt: Date | null;
        cancelledAt: Date | null;
        cancellationNote: string | null;
        cancellationReasonType: WageringCancellationReason | null;
        cancelledBy: string | null;
        balanceAtCancellation: Prisma.Decimal | null;
        forfeitedAmount: Prisma.Decimal | null;
    }): WageringRequirement {
        return new WageringRequirement(
            data.id,
            data.userId,
            data.currency,
            data.sourceType,
            data.sourceId,
            data.requiredAmount,
            data.fulfilledAmount,
            data.isAutoCancelable,
            data.principalAmount,
            data.multiplier,
            data.initialLockedCash,
            data.grantedBonusAmount,
            data.parentWageringId,
            data.appliedConfig,
            data.maxCashConversion,
            data.convertedAmount,
            data.isPaused,
            data.status,
            data.priority,
            data.createdAt,
            data.updatedAt,
            data.expiresAt,
            data.lastContributedAt,
            data.completedAt,
            data.cancelledAt,
            data.cancellationNote,
            data.cancellationReasonType,
            data.cancelledBy,
            data.balanceAtCancellation,
            data.forfeitedAmount,
        );
    }
}
