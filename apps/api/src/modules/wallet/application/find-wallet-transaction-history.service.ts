import { Inject, Injectable } from '@nestjs/common';
import { USER_WALLET_TRANSACTION_REPOSITORY } from '../ports/out/user-wallet-transaction.repository.token';
import type { UserWalletTransactionRepositoryPort } from '../ports/out/user-wallet-transaction.repository.port';
import type { UserWalletTransactionSearchOptions } from '../ports/out/user-wallet-transaction.search-options';
import { UserWalletTransaction } from '../domain';

export interface FindWalletTransactionHistoryResult {
  items: UserWalletTransaction[];
  total: number;
}

@Injectable()
export class FindWalletTransactionHistoryService {
  constructor(
    @Inject(USER_WALLET_TRANSACTION_REPOSITORY)
    private readonly transactionRepository: UserWalletTransactionRepositoryPort,
  ) {}

  async execute(
    options: UserWalletTransactionSearchOptions,
  ): Promise<FindWalletTransactionHistoryResult> {
    const [items, total] =
      await this.transactionRepository.listByUserId(options);

    return { items, total };
  }
}
