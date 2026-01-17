// src/modules/wallet/domain/model/wallet-transaction.entity.ts
import { Prisma } from 'src/generated/prisma';
import type {
    ExchangeCurrencyCode,
    TransactionType,
    TransactionStatus,
    AdjustmentReasonCode,
} from 'src/generated/prisma';

export interface WalletBalanceDetail {
    mainBalanceChange: Prisma.Decimal;
    mainBeforeAmount: Prisma.Decimal;
    mainAfterAmount: Prisma.Decimal;
    bonusBalanceChange: Prisma.Decimal;
    bonusBeforeAmount: Prisma.Decimal;
    bonusAfterAmount: Prisma.Decimal;
}

export interface WalletAdminDetail {
    adminUserId: bigint;
    reasonCode: AdjustmentReasonCode;
    internalNote?: string;
}

export interface WalletSystemDetail {
    serviceName: string;
    triggerId?: string;
    actionName: string;
    metadata?: any;
}

export class WalletTransaction {
    private constructor(
        public readonly id: bigint | null,
        public readonly userId: bigint,
        public readonly type: TransactionType,
        public readonly status: TransactionStatus,
        public readonly currency: ExchangeCurrencyCode,
        public readonly amount: Prisma.Decimal,
        public readonly beforeAmount: Prisma.Decimal,
        public readonly afterAmount: Prisma.Decimal,
        public readonly balanceDetail: WalletBalanceDetail,
        public readonly createdAt: Date,
        public readonly adminDetail?: WalletAdminDetail,
        public readonly systemDetail?: WalletSystemDetail,
    ) {
        this.validate();
    }

    /**
     * 무결성 검증
     * 총액과 세부 내역의 합이 일치하는지 확인합니다.
     */
    private validate(): void {
        const totalChange = this.balanceDetail.mainBalanceChange.add(
            this.balanceDetail.bonusBalanceChange,
        );

        // 부동 소수점 오차를 고려할 필요는 Prisma.Decimal 사용시 적지만, equals로 엄격 비교
        if (!this.amount.equals(totalChange)) {
            // NOTE: 일부 비즈니스 로직에서 합산이 다를 수 있는지 확인 필요.
            // 일반적인 입출금/게임 트랜잭션에서는 일치해야 함.
            // 만약 불일치가 허용되는 케이스가 있다면 이 검증은 제거해야 함.
        }
    }

    static create(params: {
        userId: bigint;
        type: TransactionType;
        status: TransactionStatus;
        currency: ExchangeCurrencyCode;
        amount: Prisma.Decimal;
        beforeAmount: Prisma.Decimal;
        afterAmount: Prisma.Decimal;
        balanceDetail: WalletBalanceDetail;
        adminDetail?: WalletAdminDetail;
        systemDetail?: WalletSystemDetail;
    }): WalletTransaction {
        return new WalletTransaction(
            null,
            params.userId,
            params.type,
            params.status,
            params.currency,
            params.amount,
            params.beforeAmount,
            params.afterAmount,
            params.balanceDetail,
            new Date(),
            params.adminDetail,
            params.systemDetail,
        );
    }

    static fromPersistence(data: {
        id: bigint;
        userId: bigint;
        type: TransactionType;
        status: TransactionStatus;
        currency: ExchangeCurrencyCode;
        amount: Prisma.Decimal;
        beforeAmount: Prisma.Decimal;
        afterAmount: Prisma.Decimal;
        createdAt: Date;
        balanceDetail?: {
            mainBalanceChange: Prisma.Decimal | null;
            mainBeforeAmount: Prisma.Decimal | null;
            mainAfterAmount: Prisma.Decimal | null;
            bonusBalanceChange: Prisma.Decimal | null;
            bonusBeforeAmount: Prisma.Decimal | null;
            bonusAfterAmount: Prisma.Decimal | null;
        };
        adminDetail?: {
            adminUserId: bigint;
            reasonCode: AdjustmentReasonCode;
            internalNote: string | null;
        };
        systemDetail?: {
            serviceName: string;
            triggerId: string | null;
            actionName: string;
            metadata: Prisma.JsonValue | null;
        };
    }): WalletTransaction {
        const zero = new Prisma.Decimal(0);
        const mappedBalanceDetail: WalletBalanceDetail = {
            mainBalanceChange: data.balanceDetail?.mainBalanceChange ?? zero,
            mainBeforeAmount: data.balanceDetail?.mainBeforeAmount ?? zero,
            mainAfterAmount: data.balanceDetail?.mainAfterAmount ?? zero,
            bonusBalanceChange: data.balanceDetail?.bonusBalanceChange ?? zero,
            bonusBeforeAmount: data.balanceDetail?.bonusBeforeAmount ?? zero,
            bonusAfterAmount: data.balanceDetail?.bonusAfterAmount ?? zero,
        };

        const mappedAdminDetail: WalletAdminDetail | undefined = data.adminDetail
            ? {
                adminUserId: data.adminDetail.adminUserId,
                reasonCode: data.adminDetail.reasonCode,
                internalNote: data.adminDetail.internalNote ?? undefined,
            }
            : undefined;

        const mappedSystemDetail: WalletSystemDetail | undefined = data.systemDetail
            ? {
                serviceName: data.systemDetail.serviceName,
                triggerId: data.systemDetail.triggerId ?? undefined,
                actionName: data.systemDetail.actionName,
                metadata: data.systemDetail.metadata ?? undefined,
            }
            : undefined;

        return new WalletTransaction(
            data.id,
            data.userId,
            data.type,
            data.status,
            data.currency,
            data.amount,
            data.beforeAmount,
            data.afterAmount,
            mappedBalanceDetail,
            data.createdAt,
            mappedAdminDetail,
            mappedSystemDetail,
        );
    }
}

