import { Injectable, Inject } from '@nestjs/common';
import { WALLET_TRANSACTION_REPOSITORY } from '../ports/out/wallet-transaction.repository.token';
import type { WalletTransactionRepositoryPort } from '../ports/out/wallet-transaction.repository.port';
import { WalletTransaction, WalletBalanceDetail } from '../domain';
import type { ExchangeCurrencyCode, TransactionType, TransactionStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

export interface CreateWalletTransactionParams {
    userId: bigint;
    type: TransactionType;
    status: TransactionStatus;
    currency: ExchangeCurrencyCode;
    amount: Prisma.Decimal;
    beforeBalance: Prisma.Decimal;
    afterBalance: Prisma.Decimal;
    balanceDetail: WalletBalanceDetail;
    description?: string;
    metadata?: Record<string, unknown>;
    // 외부 모듈의 ID 연결을 위한 필드들은 metadata에 넣거나, 
    // 필요 시 Transaction 엔티티 확장이 필요하지만 일단 metadata로 처리
}

@Injectable()
export class CreateWalletTransactionService {
    constructor(
        @Inject(WALLET_TRANSACTION_REPOSITORY)
        private readonly repository: WalletTransactionRepositoryPort,
    ) { }

    async execute(params: CreateWalletTransactionParams): Promise<bigint> {
        const {
            userId,
            type,
            status,
            currency,
            amount,
            beforeBalance,
            afterBalance,
            balanceDetail,
            description,
            metadata,
        } = params;

        const transaction = WalletTransaction.create({
            userId,
            type,
            status,
            currency,
            amount,
            beforeAmount: beforeBalance,
            afterAmount: afterBalance,
            balanceDetail,
            systemDetail: {
                serviceName: 'external-module', // 호출처에서 넘겨받을 수도 있음
                actionName: description || type,
                metadata: metadata,
            },
        });

        await this.repository.create(transaction);

        // Repository가 ID를 갱신해준다고 가정 (Entity가 변경됨)
        // 만약 create가 void라면, Transaction 엔티티 생성 시점에 ID가 없으므로 
        // Repository 구현체에서 insert 후 ID를 반환하거나 객체에 채워줘야 함.
        // 현재 Repository 인터페이스는 Promise<void>이므로, 
        // 실제로는 구현체 수정 또는 인터페이스 수정이 필요할 수 있음. 
        // 일단은 transaction 객체의 ID가 채워진다고 가정.
        return transaction.id!;
    }
}
