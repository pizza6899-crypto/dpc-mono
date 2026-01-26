// src/modules/wallet/ports/out/wallet-transaction.repository.port.ts
import { UserWalletTransaction } from '../../domain/model/user-wallet-transaction.entity';
import { UserWalletTransactionSearchOptions } from './user-wallet-transaction.search-options';

export interface UserWalletTransactionRepositoryPort {
    /**
     * 트랜잭션 생성
     */
    create(transaction: UserWalletTransaction): Promise<UserWalletTransaction>;

    /**
     * 사용자별 트랜잭션 목록 조회 (페이지네이션)
     * @returns [목록, 전체 개수]
     */
    listByUserId(options: UserWalletTransactionSearchOptions): Promise<[UserWalletTransaction[], number]>;
}
