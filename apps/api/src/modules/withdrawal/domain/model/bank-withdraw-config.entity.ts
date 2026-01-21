import { Prisma, ExchangeCurrencyCode } from '@prisma/client';

export interface BankWithdrawConfigProps {
    currency: ExchangeCurrencyCode;
    bankName: string;
    isActive: boolean;
    minWithdrawAmount: Prisma.Decimal;
    maxWithdrawAmount: Prisma.Decimal | null;
    withdrawFeeFixed: Prisma.Decimal;
    withdrawFeeRate: Prisma.Decimal;
    description: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

export class BankWithdrawConfig {
    private constructor(
        public readonly id: bigint,
        public readonly props: BankWithdrawConfigProps,
    ) { }

    static rehydrate(id: bigint, props: BankWithdrawConfigProps): BankWithdrawConfig {
        return new BankWithdrawConfig(id, props);
    }

    // 팩토리 메서드 (New)
    static createNew(id: bigint, props: Omit<BankWithdrawConfigProps, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): BankWithdrawConfig {
        const now = new Date();
        return new BankWithdrawConfig(id, {
            ...props,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    /**
     * 상태 변경
     */
    update(props: Partial<Omit<BankWithdrawConfigProps, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>): void {
        Object.assign(this.props, {
            ...props,
            updatedAt: new Date(),
        });
    }

    toggleActive(): void {
        this.props.isActive = !this.props.isActive;
        this.props.updatedAt = new Date();
    }

    delete(): void {
        this.props.deletedAt = new Date();
    }

    restore(): void {
        this.props.deletedAt = null;
        this.props.updatedAt = new Date();
    }

    get currency(): ExchangeCurrencyCode {
        return this.props.currency;
    }

    get bankName(): string {
        return this.props.bankName;
    }

    get isActive(): boolean {
        return this.props.isActive;
    }

    get minWithdrawAmount(): Prisma.Decimal {
        return this.props.minWithdrawAmount;
    }

    get maxWithdrawAmount(): Prisma.Decimal | null {
        return this.props.maxWithdrawAmount;
    }

    /**
     * 수수료 계산
     */
    calculateFee(amount: Prisma.Decimal): Prisma.Decimal {
        const rateFee = amount.mul(this.props.withdrawFeeRate);
        return this.props.withdrawFeeFixed.add(rateFee);
    }

    /**
     * 금액 검증
     */
    validateAmount(amount: Prisma.Decimal): { valid: boolean; reason?: string } {
        if (amount.lt(this.props.minWithdrawAmount)) {
            return {
                valid: false,
                reason: `Minimum withdrawal amount is ${this.props.minWithdrawAmount}`,
            };
        }
        if (this.props.maxWithdrawAmount && amount.gt(this.props.maxWithdrawAmount)) {
            return {
                valid: false,
                reason: `Maximum withdrawal amount is ${this.props.maxWithdrawAmount}`,
            };
        }
        return { valid: true };
    }

    /**
     * 스냅샷 생성 (WithdrawalDetail.appliedConfig용)
     */
    toSnapshot(): Record<string, unknown> {
        return {
            configId: this.id.toString(),
            currency: this.props.currency,
            bankName: this.props.bankName,
            minWithdrawAmount: this.props.minWithdrawAmount.toString(),
            maxWithdrawAmount: this.props.maxWithdrawAmount?.toString() ?? null,
            withdrawFeeFixed: this.props.withdrawFeeFixed.toString(),
            withdrawFeeRate: this.props.withdrawFeeRate.toString(),
        };
    }
}
