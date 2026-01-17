// src/modules/wallet/ports/out/user-wallet.repository.port.ts
import type { UserWallet } from '../../domain';
import type { ExchangeCurrencyCode } from 'src/generated/prisma';

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
   * 사용자 ID와 통화로 잔액 조회 (Pessimistic Lock / 비관적 락)
   *
   * 데이터 수정 시 동시성 제어를 위해 사용합니다.
   * 해당 로우를 잠금 처리하여 트랜잭션이 종료될 때까지 다른 트랜잭션의 접근을 대기시킵니다.
   */
  /**
   * 사용자 ID에 대한 배타적 락 획득 (Advisory Lock)
   */
  acquireLock(userId: bigint): Promise<void>;

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

