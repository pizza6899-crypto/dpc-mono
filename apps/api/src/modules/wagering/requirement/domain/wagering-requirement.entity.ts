import { Prisma } from '@prisma/client';
import type {
    ExchangeCurrencyCode,
    WageringSourceType,
    WageringStatus,
    WageringCancellationReason
} from '@prisma/client';

export interface WageringRequirementProps {
    id: bigint | null;
    userId: bigint;
    currency: ExchangeCurrencyCode;
    sourceType: WageringSourceType;

    // 금액 관련
    requiredAmount: Prisma.Decimal;
    fulfilledAmount: Prisma.Decimal;
    autoCancelThreshold: Prisma.Decimal | null;
    isAutoCancelable: boolean;

    // 메타 데이터 및 설정 스냅샷
    principalAmount: Prisma.Decimal;
    multiplier: Prisma.Decimal;
    lockedAmount: Prisma.Decimal;
    appliedConfig: any; // Json

    // 정산 규칙 및 결과
    maxCashConversion: Prisma.Decimal | null;
    convertedAmount: Prisma.Decimal | null;

    // 상태
    isPaused: boolean;
    status: WageringStatus;
    priority: number;

    // 링크
    depositDetailId: bigint | null;
    userPromotionId: bigint | null;

    // 타임스탬프
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date | null;
    lastContributedAt: Date | null;

    // 완료/취소 이력
    completedAt: Date | null;
    cancelledAt: Date | null;
    cancellationNote: string | null;
    cancellationReasonType: WageringCancellationReason | null;
    cancelledBy: string | null;
    balanceAtCancellation: Prisma.Decimal | null;
    forfeitedAmount: Prisma.Decimal | null;
}

export class WageringRequirement {
    private constructor(public readonly props: WageringRequirementProps) { }

    get id(): bigint | null {
        return this.props.id;
    }

    get userId(): bigint {
        return this.props.userId;
    }

    get currency(): ExchangeCurrencyCode {
        return this.props.currency;
    }

    get sourceType(): WageringSourceType {
        return this.props.sourceType;
    }

    get requiredAmount(): Prisma.Decimal {
        return this.props.requiredAmount;
    }

    get fulfilledAmount(): Prisma.Decimal {
        return this.props.fulfilledAmount;
    }

    get autoCancelThreshold(): Prisma.Decimal | null {
        return this.props.autoCancelThreshold;
    }

    get isAutoCancelable(): boolean {
        return this.props.isAutoCancelable;
    }

    get principalAmount(): Prisma.Decimal {
        return this.props.principalAmount;
    }

    get multiplier(): Prisma.Decimal {
        return this.props.multiplier;
    }

    get lockedAmount(): Prisma.Decimal {
        return this.props.lockedAmount;
    }

    get appliedConfig(): any {
        return this.props.appliedConfig;
    }

    get maxCashConversion(): Prisma.Decimal | null {
        return this.props.maxCashConversion;
    }

    get convertedAmount(): Prisma.Decimal | null {
        return this.props.convertedAmount;
    }

    get isPaused(): boolean {
        return this.props.isPaused;
    }

    get status(): WageringStatus {
        return this.props.status;
    }

    get priority(): number {
        return this.props.priority;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    get updatedAt(): Date {
        return this.props.updatedAt;
    }

    get expiresAt(): Date | null {
        return this.props.expiresAt;
    }

    get lastContributedAt(): Date | null {
        return this.props.lastContributedAt;
    }

    get completedAt(): Date | null {
        return this.props.completedAt;
    }

    get cancelledAt(): Date | null {
        return this.props.cancelledAt;
    }

    get cancellationNote(): string | null {
        return this.props.cancellationNote;
    }

    get depositDetailId(): bigint | null {
        return this.props.depositDetailId;
    }

    get userPromotionId(): bigint | null {
        return this.props.userPromotionId;
    }

    get remainingAmount(): Prisma.Decimal {
        const remaining = this.requiredAmount.sub(this.fulfilledAmount);
        return remaining.isNeg() ? new Prisma.Decimal('0') : remaining;
    }

    get isCompleted(): boolean {
        return this.props.status === 'COMPLETED';
    }

    get isExpired(): boolean {
        return this.props.expiresAt !== null && this.props.expiresAt < new Date();
    }

    get isActive(): boolean {
        return this.props.status === 'ACTIVE' && !this.props.isPaused && !this.isExpired;
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

        this.props.fulfilledAmount = this.props.fulfilledAmount.add(actualContribution);
        this.props.lastContributedAt = new Date();

        if (this.props.fulfilledAmount.greaterThanOrEqualTo(this.props.requiredAmount)) {
            this.complete();
        }

        return actualContribution;
    }

    pause(): void {
        this.props.isPaused = true;
    }

    resume(): void {
        this.props.isPaused = false;
    }

    complete(finalBalance?: Prisma.Decimal): void {
        if (this.props.status !== 'ACTIVE') return;

        this.props.status = 'COMPLETED';
        this.props.completedAt = new Date();

        // 현금 전환 로직: maxCashConversion이 설정되어 있으면 해당 금액까지만 인정
        if (finalBalance && this.props.maxCashConversion) {
            this.props.convertedAmount = finalBalance.greaterThan(this.props.maxCashConversion)
                ? this.props.maxCashConversion
                : finalBalance;
        } else if (finalBalance) {
            this.props.convertedAmount = finalBalance;
        }
    }

    cancel(params: {
        reason: WageringCancellationReason;
        note?: string;
        cancelledBy?: string;
        balanceAtCancellation?: Prisma.Decimal;
        forfeitedAmount?: Prisma.Decimal;
    }): void {
        if (this.props.status !== 'ACTIVE') return;

        this.props.status = 'CANCELLED';
        this.props.cancelledAt = new Date();
        this.props.cancellationReasonType = params.reason;
        this.props.cancellationNote = params.note || null;
        this.props.cancelledBy = params.cancelledBy || 'SYSTEM';
        this.props.balanceAtCancellation = params.balanceAtCancellation || null;
        this.props.forfeitedAmount = params.forfeitedAmount || null;
    }

    void(note?: string, cancelledBy?: string): void {
        this.props.status = 'VOIDED';
        this.props.cancelledAt = new Date();
        this.props.cancellationReasonType = 'SYSTEM_ERROR';
        this.props.cancellationNote = note || null;
        this.props.cancelledBy = cancelledBy || 'SYSTEM';
    }

    expire(): void {
        if (this.props.status !== 'ACTIVE') return;

        this.props.status = 'EXPIRED';
        this.props.cancelledAt = new Date();
        this.props.cancellationReasonType = 'EXPIRED';
        this.props.cancelledBy = 'SYSTEM';
    }

    static create(params: {
        id: bigint;
        userId: bigint;
        currency: ExchangeCurrencyCode;
        sourceType: WageringSourceType;
        requiredAmount: Prisma.Decimal;
        principalAmount?: Prisma.Decimal;
        multiplier?: Prisma.Decimal;
        lockedAmount?: Prisma.Decimal;
        autoCancelThreshold?: Prisma.Decimal | null;
        isAutoCancelable?: boolean;
        maxCashConversion?: Prisma.Decimal | null;
        appliedConfig?: any;
        priority?: number;
        depositDetailId?: bigint | null;
        userPromotionId?: bigint | null;
        expiresAt?: Date | null;
    }): WageringRequirement {
        return new WageringRequirement({
            id: params.id,
            userId: params.userId,
            currency: params.currency,
            sourceType: params.sourceType,
            requiredAmount: params.requiredAmount,
            fulfilledAmount: new Prisma.Decimal(0),
            autoCancelThreshold: params.autoCancelThreshold ?? null,
            isAutoCancelable: params.isAutoCancelable ?? true,
            principalAmount: params.principalAmount ?? new Prisma.Decimal(0),
            multiplier: params.multiplier ?? new Prisma.Decimal(1),
            lockedAmount: params.lockedAmount ?? new Prisma.Decimal(0),
            appliedConfig: params.appliedConfig ?? {},
            maxCashConversion: params.maxCashConversion ?? null,
            convertedAmount: null,
            isPaused: false,
            status: 'ACTIVE',
            priority: params.priority ?? 0,
            depositDetailId: params.depositDetailId ?? null,
            userPromotionId: params.userPromotionId ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
            expiresAt: params.expiresAt ?? null,
            lastContributedAt: null,
            completedAt: null,
            cancelledAt: null,
            cancellationNote: null,
            cancellationReasonType: null,
            cancelledBy: null,
            balanceAtCancellation: null,
            forfeitedAmount: null,
        });
    }

    static rehydrate(props: WageringRequirementProps): WageringRequirement {
        return new WageringRequirement(props);
    }
}
