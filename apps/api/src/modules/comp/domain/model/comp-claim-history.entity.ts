import { CompClaimStatus, ExchangeCurrencyCode, Prisma } from '@prisma/client';

export class CompClaimHistory {
    private constructor(
        public readonly id: bigint,
        public readonly userId: bigint,
        public readonly status: CompClaimStatus,
        public readonly failureReason: string | null,
        public readonly compWalletTransactionId: bigint,
        public readonly compAmount: Prisma.Decimal,
        public readonly compCurrency: ExchangeCurrencyCode,
        public readonly walletTransactionId: bigint | null,
        public readonly targetAmount: Prisma.Decimal,
        public readonly targetCurrency: ExchangeCurrencyCode,
        public readonly exchangeRate: Prisma.Decimal,
        public readonly claimedAt: Date,
    ) { }

    static create(params: {
        userId: bigint;
        compWalletTransactionId: bigint;
        compAmount: Prisma.Decimal;
        compCurrency: ExchangeCurrencyCode;
        targetAmount: Prisma.Decimal;
        targetCurrency: ExchangeCurrencyCode;
        exchangeRate?: Prisma.Decimal;
        status?: CompClaimStatus;
    }): CompClaimHistory {
        return new CompClaimHistory(
            BigInt(0), // ID is assigned by DB
            params.userId,
            params.status ?? CompClaimStatus.PENDING,
            null,
            params.compWalletTransactionId,
            params.compAmount,
            params.compCurrency,
            null, // walletTransactionId is set after successful wallet transaction
            params.targetAmount,
            params.targetCurrency,
            params.exchangeRate ?? new Prisma.Decimal(1),
            new Date(),
        );
    }

    static rehydrate(params: {
        id: bigint;
        userId: bigint;
        status: CompClaimStatus;
        failureReason: string | null;
        compWalletTransactionId: bigint;
        compAmount: Prisma.Decimal;
        compCurrency: ExchangeCurrencyCode;
        walletTransactionId: bigint | null;
        targetAmount: Prisma.Decimal;
        targetCurrency: ExchangeCurrencyCode;
        exchangeRate: Prisma.Decimal;
        claimedAt: Date;
    }): CompClaimHistory {
        return new CompClaimHistory(
            params.id,
            params.userId,
            params.status,
            params.failureReason,
            params.compWalletTransactionId,
            params.compAmount,
            params.compCurrency,
            params.walletTransactionId,
            params.targetAmount,
            params.targetCurrency,
            params.exchangeRate,
            params.claimedAt,
        );
    }

    complete(walletTransactionId: bigint): CompClaimHistory {
        return new CompClaimHistory(
            this.id,
            this.userId,
            CompClaimStatus.COMPLETED,
            null,
            this.compWalletTransactionId,
            this.compAmount,
            this.compCurrency,
            walletTransactionId,
            this.targetAmount,
            this.targetCurrency,
            this.exchangeRate,
            this.claimedAt,
        );
    }

    fail(reason: string): CompClaimHistory {
        return new CompClaimHistory(
            this.id,
            this.userId,
            CompClaimStatus.FAILED,
            reason,
            this.compWalletTransactionId,
            this.compAmount,
            this.compCurrency,
            this.walletTransactionId,
            this.targetAmount,
            this.targetCurrency,
            this.exchangeRate,
            this.claimedAt,
        );
    }
}
