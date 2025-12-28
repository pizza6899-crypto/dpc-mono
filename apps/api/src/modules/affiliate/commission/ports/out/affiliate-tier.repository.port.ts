// src/modules/affiliate/commission/ports/out/affiliate-tier.repository.port.ts
import type { AffiliateTierLevel } from '@repo/database';
import type { AffiliateTier } from '../../domain';

/**
 * AffiliateTier Repository Port (Outbound Port)
 * 어필리에이트 티어 데이터 접근 인터페이스
 */
export interface AffiliateTierRepositoryPort {
  /**
   * 어필리에이트 티어 조회
   * @param affiliateId - 어필리에이트 ID
   * @returns 티어 엔티티 또는 null
   */
  findByAffiliateId(affiliateId: string): Promise<AffiliateTier | null>;

  /**
   * 어필리에이트 티어 조회 (없으면 예외)
   * @param affiliateId - 어필리에이트 ID
   * @returns 티어 엔티티
   * @throws {TierNotFoundException} 티어가 없는 경우
   */
  getByAffiliateId(affiliateId: string): Promise<AffiliateTier>;

  /**
   * 티어 생성 또는 업데이트
   * @param tier - 티어 엔티티
   * @returns 저장된 티어 엔티티
   */
  upsert(tier: AffiliateTier): Promise<AffiliateTier>;

  /**
   * 티어 업데이트
   * @param affiliateId - 어필리에이트 ID
   * @param tier - 새로운 티어 레벨
   * @param baseRate - 새로운 기본 요율
   * @returns 업데이트된 티어 엔티티
   */
  updateTier(
    affiliateId: string,
    tier: AffiliateTierLevel,
    baseRate: bigint,
  ): Promise<AffiliateTier>;

  /**
   * 월간 베팅 금액 업데이트
   * @param affiliateId - 어필리에이트 ID
   * @param monthlyWagerAmount - 월간 총 베팅 금액
   * @returns 업데이트된 티어 엔티티
   */
  updateMonthlyWagerAmount(
    affiliateId: string,
    monthlyWagerAmount: bigint,
  ): Promise<AffiliateTier>;

  /**
   * 월간 베팅 금액 초기화 (월간 리셋)
   * @param affiliateId - 어필리에이트 ID
   * @returns 업데이트된 티어 엔티티
   */
  resetMonthlyWagerAmount(affiliateId: string): Promise<AffiliateTier>;
}
