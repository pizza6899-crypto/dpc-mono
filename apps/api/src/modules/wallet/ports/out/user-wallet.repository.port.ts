import type { UserWallet } from '../../domain';
import type { ExchangeCurrencyCode } from '@prisma/client';
import type { UserWalletSearchOptions } from './user-wallet.search-options';

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
   * 시스템 전체 통학별/타입별 잔액 통계 조회
   */
  getStatistics(): Promise<any>;

  /**
   * 사용자 ID와 통화로 잔액 조회 (없으면 에러)
   */
  getByUserIdAndCurrency(
    userId: bigint,
    currency: ExchangeCurrencyCode,
  ): Promise<UserWallet>;

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
   * 월렛 목록 조회 (검색 및 페이지네이션)
   */
  list(options: UserWalletSearchOptions): Promise<[UserWallet[], number]>;

  /**
   * 월렛 업데이트
   * 존재하지 않는 경우 에러가 발생할 수 있습니다.
   */
  update(wallet: UserWallet): Promise<UserWallet>;
}
