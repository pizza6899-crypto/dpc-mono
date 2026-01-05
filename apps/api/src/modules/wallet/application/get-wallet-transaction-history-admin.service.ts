import { Inject, Injectable } from '@nestjs/common';
import { WALLET_TRANSACTION_REPOSITORY } from '../ports/out/wallet-transaction.repository.token';
import type { WalletTransactionRepositoryPort } from '../ports/out/wallet-transaction.repository.port';
import type { WalletTransactionSearchOptions } from '../domain/model/wallet-transaction.search-options';
import { WalletTransaction } from '../domain';

interface GetWalletTransactionHistoryAdminResult {
    items: WalletTransaction[];
    total: number;
}

@Injectable()
export class GetWalletTransactionHistoryAdminService {
    constructor(
        @Inject(WALLET_TRANSACTION_REPOSITORY)
        private readonly transactionRepository: WalletTransactionRepositoryPort,
    ) { }

    async execute(
        options: WalletTransactionSearchOptions,
    ): Promise<GetWalletTransactionHistoryAdminResult> {
        const [items, total] = await this.transactionRepository.findByUserId(options);

        return { items, total };
    }
}
