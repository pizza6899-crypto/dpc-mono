import { Inject, Injectable } from '@nestjs/common';
import { WALLET_TRANSACTION_REPOSITORY } from '../ports/out/wallet-transaction.repository.token';
import type { WalletTransactionRepositoryPort } from '../ports/out/wallet-transaction.repository.port';
import type { WalletTransactionSearchOptions } from '../ports/out/wallet-transaction.search-options';
import { WalletTransaction } from '../domain';

export interface FindWalletTransactionHistoryResult {
    items: WalletTransaction[];
    total: number;
}

@Injectable()
export class FindWalletTransactionHistoryService {
    constructor(
        @Inject(WALLET_TRANSACTION_REPOSITORY)
        private readonly transactionRepository: WalletTransactionRepositoryPort,
    ) { }

    async execute(
        options: WalletTransactionSearchOptions,
    ): Promise<FindWalletTransactionHistoryResult> {
        const [items, total] = await this.transactionRepository.listByUserId(options);

        return { items, total };
    }
}
