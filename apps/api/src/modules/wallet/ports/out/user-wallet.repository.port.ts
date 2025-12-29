// src/modules/wallet/ports/out/user-wallet.repository.port.ts
import type { UserWallet } from '../../domain';
import type { ExchangeCurrencyCode } from '@repo/database';

/**
 * UserWallet Repository Port
 *
 * 사용자 잔액 조회 및 생성 기능을 정의합니다.
 */
export interface UserWalletRepositoryPort {
  /**
   * 사용자 ID와 통화로 잔액 조회
   */
  findByUserIdAndCurrency(
    userId: bigint,
    currency: ExchangeCurrencyCode,
  ): Promise<UserWallet | null>;

  /**
   * 사용자 ID로 모든 통화의 잔액 조회
   */
  findByUserId(userId: bigint): Promise<UserWallet[]>;

  /**
   * 월렛 생성 또는 업데이트
   * @param wallet - 월렛 엔티티
   * @returns 저장된 월렛 엔티티
   */
  upsert(wallet: UserWallet): Promise<UserWallet>;
}

