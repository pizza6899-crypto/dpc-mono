import { Prisma } from '@repo/database';

export interface CryptoWithdrawConfigProps {
    symbol: string;
    network: string;
    isActive: boolean;
    minWithdrawAmount: Prisma.Decimal;
    maxWithdrawAmount: Prisma.Decimal | null;
    autoProcessLimit: Prisma.Decimal | null;
    withdrawFeeFixed: Prisma.Decimal;
    withdrawFeeRate: Prisma.Decimal;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

export class CryptoWithdrawConfig {
    private constructor(
        public readonly id: bigint,
        public readonly props: CryptoWithdrawConfigProps,
    ) { }

    static rehydrate(id: bigint, props: CryptoWithdrawConfigProps): CryptoWithdrawConfig {
        return new CryptoWithdrawConfig(id, props);
    }

    get symbol(): string {
        return this.props.symbol;
    }

    get network(): string {
        return this.props.network;
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

    get autoProcessLimit(): Prisma.Decimal | null {
        return this.props.autoProcessLimit;
    }

    /**
     * 수수료 계산
     */
    calculateFee(amount: Prisma.Decimal): Prisma.Decimal {
        const rateFee = amount.mul(this.props.withdrawFeeRate);
        return this.props.withdrawFeeFixed.add(rateFee);
    }

    /**
     * 자동 처리 가능 여부
     */
    canAutoProcess(amount: Prisma.Decimal): boolean {
        if (!this.props.autoProcessLimit) {
            return true; // 한도 없으면 항상 자동
        }
        return amount.lte(this.props.autoProcessLimit);
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
            symbol: this.props.symbol,
            network: this.props.network,
            minWithdrawAmount: this.props.minWithdrawAmount.toString(),
            maxWithdrawAmount: this.props.maxWithdrawAmount?.toString() ?? null,
            autoProcessLimit: this.props.autoProcessLimit?.toString() ?? null,
            withdrawFeeFixed: this.props.withdrawFeeFixed.toString(),
            withdrawFeeRate: this.props.withdrawFeeRate.toString(),
        };
    }
}
