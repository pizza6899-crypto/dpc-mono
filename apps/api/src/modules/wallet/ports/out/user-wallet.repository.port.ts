// src/modules/wallet/ports/out/user-wallet.repository.port.ts
import type { UserWallet } from '../../domain';
import type { ExchangeCurrencyCode } from '@prisma/client';

/**
 * UserWallet Repository Port
 *
 * 사용자 잔액 조회 및 관리(생성, 수정) 기능을 정의합니다.
 */
export interface UserWalletRepositoryPort {
  /**
   * 사용자 ID와 통화로 잔액 조회 (없으면 null)
   */
  findByUserIdAndCurrency(
    userId: bigint,
    currency: ExchangeCurrencyCode,
  ): Promise<UserWallet | null>;

  /**
   * 사용자 ID와 통화로 잔액 조회 (없으면 에러)
   */
  getByUserIdAndCurrency(
    userId: bigint,
    currency: ExchangeCurrencyCode,
  ): Promise<UserWallet>;

  /**
   * 사용자 ID에 대한 배타적 락 획득 (Advisory Lock)
   * 트랜잭션 범위 내에서 호출해야 하며, 트랜잭션 종료 시 자동 해제됩니다.
   */
  acquireLock(userId: bigint): Promise<void>;

  /**
   * 사용자 ID로 보유한 모든 지갑 목록 조회
   */
  findByUserId(userId: bigint): Promise<UserWallet[]>;

  /**
   * 월렛 생성
   * 이미 존재하는 경우 에러가 발생할 수 있습니다.
   */
  create(wallet: UserWallet): Promise<UserWallet>;

  /**
   * 월렛 업데이트
   * 존재하지 않는 경우 에러가 발생할 수 있습니다.
   */
  update(wallet: UserWallet): Promise<UserWallet>;
}

