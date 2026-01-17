// src/modules/affiliate/commission/ports/out/affiliate-wallet.repository.port.ts
import type { ExchangeCurrencyCode } from 'src/generated/prisma';
import type { AffiliateWallet } from '../../domain';

/**
 * AffiliateWallet Repository Port (Outbound Port)
 * 어필리에이트 월렛 데이터 접근 인터페이스
 */
export interface AffiliateWalletRepositoryPort {
  /**
   * 어필리에이트의 특정 통화 월렛 조회
   * @param affiliateId - 어필리에이트 ID
   * @param currency - 통화 코드
   * @returns 월렛 엔티티 또는 null
   */
  findByAffiliateIdAndCurrency(
    affiliateId: bigint,
    currency: ExchangeCurrencyCode,
  ): Promise<AffiliateWallet | null>;

  /**
   * 어필리에이트의 특정 통화 월렛 조회 (없으면 예외)
   * @param affiliateId - 어필리에이트 ID
   * @param currency - 통화 코드
   * @returns 월렛 엔티티
   * @throws {WalletNotFoundException} 월렛이 없는 경우
   */
  getByAffiliateIdAndCurrency(
    affiliateId: bigint,
    currency: ExchangeCurrencyCode,
  ): Promise<AffiliateWallet>;

  /**
   * 어필리에이트의 모든 월렛 조회
   * @param affiliateId - 어필리에이트 ID
   * @returns 월렛 엔티티 배열
   */
  findByAffiliateId(affiliateId: bigint): Promise<AffiliateWallet[]>;

  /**
   * 월렛 생성 또는 업데이트
   * @param wallet - 월렛 엔티티
   * @returns 저장된 월렛 엔티티
   */
  upsert(wallet: AffiliateWallet): Promise<AffiliateWallet>;

  /**
   * 월렛 잔액 업데이트
   * @param affiliateId - 어필리에이트 ID
   * @param currency - 통화 코드
   * @param availableBalance - 출금 가능 잔액
   * @param pendingBalance - 대기 중인 커미션
   * @param totalEarned - 총 적립 커미션
   * @returns 업데이트된 월렛 엔티티
   */
  updateBalance(
    affiliateId: bigint,
    currency: ExchangeCurrencyCode,
    availableBalance: bigint,
    pendingBalance: bigint,
    totalEarned: bigint,
  ): Promise<AffiliateWallet>;
}
