import { Prisma } from '@repo/database';
import type { ExchangeCurrencyCode, WageringSourceType, WageringStatus } from '@repo/database';
import { createId } from '@paralleldrive/cuid2';

export interface WageringRequirementProps {
    id: bigint | null;
    uid: string;
    userId: bigint;
    currency: ExchangeCurrencyCode;
    sourceType: WageringSourceType;
    requiredAmount: Prisma.Decimal;
    currentAmount: Prisma.Decimal;
    cancellationBalanceThreshold: Prisma.Decimal | null;
    status: WageringStatus;
    priority: number;
    depositDetailId: bigint | null;
    userPromotionId: bigint | null;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date | null;
    completedAt: Date | null;
    cancelledAt: Date | null;
    cancellationNote: string | null;
}

export class WageringRequirement {
    private constructor(public readonly props: WageringRequirementProps) { }

    get id(): bigint | null {
        return this.props.id;
    }

    get uid(): string {
        return this.props.uid;
    }

    get userId(): bigint {
        return this.props.userId;
    }

    get currency(): ExchangeCurrencyCode {
        return this.props.currency;
    }

    get status(): WageringStatus {
        return this.props.status;
    }

    get remainingAmount(): Prisma.Decimal {
        const remaining = this.props.requiredAmount.sub(this.props.currentAmount);
        return remaining.isNeg() ? new Prisma.Decimal(0) : remaining;
    }

    get isCompleted(): boolean {
        return this.props.status === 'COMPLETED';
    }

    get isActive(): boolean {
        return this.props.status === 'ACTIVE';
    }

    /**
     * 베팅 금액을 기여하고 실제 기여된 금액을 반환합니다.
     * 남은 필요 롤링 금액보다 많이 기여할 수는 없습니다.
     */
    contribute(contributionAmount: Prisma.Decimal): Prisma.Decimal {
        if (!this.isActive) {
            return new Prisma.Decimal(0);
        }

        const remaining = this.remainingAmount;

        // 실제 반영될 금액 (남은 금액과 기여 가능 금액 중 작은 것)
        const actualContribution = contributionAmount.greaterThan(remaining)
            ? remaining
            : contributionAmount;

        this.props.currentAmount = this.props.currentAmount.add(actualContribution);

        // 완료 조건 체크
        if (this.props.currentAmount.greaterThanOrEqualTo(this.props.requiredAmount)) {
            this.complete();
        }

        return actualContribution;
    }

    complete(): void {
        if (this.props.status === 'COMPLETED' || this.props.status === 'CANCELLED' || this.props.status === 'VOIDED') {
            return;
        }
        this.props.status = 'COMPLETED';
        this.props.completedAt = new Date();
    }

    cancel(note?: string): void {
        if (this.props.status !== 'ACTIVE') {
            return;
        }
        this.props.status = 'CANCELLED';
        this.props.cancelledAt = new Date();
        this.props.cancellationNote = note || null;
    }

    void(note?: string): void {
        this.props.status = 'VOIDED';
        this.props.cancelledAt = new Date();
        this.props.cancellationNote = note || null;
    }

    expire(): void {
        if (this.props.status !== 'ACTIVE') {
            return;
        }
        this.props.status = 'EXPIRED';
        this.props.cancelledAt = new Date();
    }

    static create(params: {
        userId: bigint;
        currency: ExchangeCurrencyCode;
        sourceType: WageringSourceType;
        requiredAmount: Prisma.Decimal;
        priority?: number;
        depositDetailId?: bigint | null;
        userPromotionId?: bigint | null;
        expiresAt?: Date | null;
        cancellationBalanceThreshold?: Prisma.Decimal | null;
    }): WageringRequirement {
        return new WageringRequirement({
            id: null,
            uid: createId(),
            userId: params.userId,
            currency: params.currency,
            sourceType: params.sourceType,
            requiredAmount: params.requiredAmount,
            currentAmount: new Prisma.Decimal(0),
            cancellationBalanceThreshold: params.cancellationBalanceThreshold ?? null,
            status: 'ACTIVE',
            priority: params.priority ?? 0,
            depositDetailId: params.depositDetailId ?? null,
            userPromotionId: params.userPromotionId ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
            expiresAt: params.expiresAt ?? null,
            completedAt: null,
            cancelledAt: null,
            cancellationNote: null,
        });
    }

    static rehydrate(props: WageringRequirementProps): WageringRequirement {
        return new WageringRequirement(props);
    }
}
