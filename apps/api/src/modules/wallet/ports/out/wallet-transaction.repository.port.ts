// src/modules/wallet/ports/out/wallet-transaction.repository.port.ts
import { WalletTransaction } from '../../domain/model/wallet-transaction.entity';

import { WalletTransactionSearchOptions } from '../../application/wallet-transaction.search-options';

export interface WalletTransactionRepositoryPort {
    /**
     * 트랜잭션 생성
     */
    create(transaction: WalletTransaction): Promise<WalletTransaction>;

    /**
     * 사용자별 트랜잭션 목록 조회 (페이지네이션)
     * @returns [목록, 전체 개수]
     */
    listByUserId(options: WalletTransactionSearchOptions): Promise<[WalletTransaction[], number]>;
}
