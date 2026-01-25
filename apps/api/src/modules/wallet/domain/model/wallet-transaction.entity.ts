import { ExchangeCurrencyCode, Prisma, WalletBalanceType, WalletTransactionType } from "@prisma/client";
import { AnyWalletTransactionMetadata } from "./wallet-transaction-metadata";

/**
 * WalletTransaction 도메인 엔티티
 * 
 * 지갑의 모든 잔액 변동 이력을 기록합니다.
 */
export class WalletTransaction {
    private constructor(
        // Identity
        public readonly id: bigint | null,
        public readonly createdAt: Date,

        // Core fields
        public readonly type: WalletTransactionType,
        public readonly balanceType: WalletBalanceType,
        public readonly amount: Prisma.Decimal, // (+) 수입, (-) 지출
        public readonly balanceBefore: Prisma.Decimal,
        public readonly balanceAfter: Prisma.Decimal,

        // Reference & Detail
        public readonly referenceId: bigint | null,
        private readonly _metadata: AnyWalletTransactionMetadata | null,

        // Security/Audit
        public readonly ipAddress: string | null,
        public readonly countryCode: string | null,

        // Foreign Keys
        public readonly userId: bigint,
        public readonly currency: ExchangeCurrencyCode,
    ) { }

    static create(params: {
        userId: bigint;
        currency: ExchangeCurrencyCode;
        type: WalletTransactionType;
        balanceType: WalletBalanceType;
        amount: Prisma.Decimal;
        balanceBefore: Prisma.Decimal;
        balanceAfter: Prisma.Decimal;
        referenceId?: bigint | null;
        metadata?: AnyWalletTransactionMetadata | null;
        ipAddress?: string | null;
        countryCode?: string | null;
        createdAt?: Date;
    }): WalletTransaction {
        // 도메인 유효성 검사 (필요 시)
        return new WalletTransaction(
            null, // DB 저장 시 자동 생성
            params.createdAt ?? new Date(),
            params.type,
            params.balanceType,
            params.amount,
            params.balanceBefore,
            params.balanceAfter,
            params.referenceId ?? null,
            params.metadata ?? null,
            params.ipAddress ?? null,
            params.countryCode ?? null,
            params.userId,
            params.currency,
        );
    }

    static fromPersistence(data: {
        id: bigint;
        createdAt: Date;
        type: WalletTransactionType;
        balanceType: WalletBalanceType;
        amount: Prisma.Decimal;
        balanceBefore: Prisma.Decimal;
        balanceAfter: Prisma.Decimal;
        referenceId: bigint | null;
        metadata: any | null;
        ipAddress: string | null;
        countryCode: string | null;
        userId: bigint;
        currency: ExchangeCurrencyCode;
    }): WalletTransaction {
        return new WalletTransaction(
            data.id,
            data.createdAt,
            data.type,
            data.balanceType,
            data.amount,
            data.balanceBefore,
            data.balanceAfter,
            data.referenceId,
            data.metadata as AnyWalletTransactionMetadata,
            data.ipAddress,
            data.countryCode,
            data.userId,
            data.currency,
        );
    }

    // Getters
    get metadata(): AnyWalletTransactionMetadata | null {
        return this._metadata;
    }

    // Identification Logic
    get isIncome(): boolean {
        return this.amount.isPositive();
    }

    get isOutcome(): boolean {
        return this.amount.isNegative();
    }
}
