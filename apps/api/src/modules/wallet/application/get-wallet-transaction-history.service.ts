import { Inject, Injectable } from '@nestjs/common';
import { WALLET_TRANSACTION_REPOSITORY } from '../ports/out/wallet-transaction.repository.token';
import type { WalletTransactionRepositoryPort } from '../ports/out/wallet-transaction.repository.port';
import type { WalletTransactionSearchOptions } from './wallet-transaction.search-options';
import { WalletTransaction } from '../domain';

export interface GetWalletTransactionHistoryResult {
    items: WalletTransaction[];
    total: number;
}

@Injectable()
export class GetWalletTransactionHistoryService {
    constructor(
        @Inject(WALLET_TRANSACTION_REPOSITORY)
        private readonly transactionRepository: WalletTransactionRepositoryPort,
    ) { }

    async execute(
        options: WalletTransactionSearchOptions,
    ): Promise<GetWalletTransactionHistoryResult> {
        const [items, total] = await this.transactionRepository.listByUserId(options);

        return { items, total };
    }
}
