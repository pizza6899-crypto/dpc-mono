// src/modules/wallet/ports/out/wallet-transaction.repository.port.ts
import { WalletTransaction } from '../../domain/model/wallet-transaction.entity';

import { WalletTransactionSearchOptions } from '../../domain/model/wallet-transaction.search-options';

export interface WalletTransactionRepositoryPort {
    create(transaction: WalletTransaction): Promise<void>;
    findByUserId(options: WalletTransactionSearchOptions): Promise<[WalletTransaction[], number]>;
}
