// src/modules/affiliate/commission/ports/out/affiliate-commission.repository.port.ts
import type { CommissionStatus, ExchangeCurrencyCode } from 'src/generated/prisma';
import type { AffiliateCommission } from '../../domain';

/**
 * AffiliateCommission Repository Port (Outbound Port)
 * 어필리에이트 커미션 데이터 접근 인터페이스
 */
export interface AffiliateCommissionRepositoryPort {
  /**
   * 커미션 ID로 조회
   * @param id - 커미션 ID (BigInt)
   * @returns 커미션 엔티티 또는 null
   */
  findById(id: bigint): Promise<AffiliateCommission | null>;

  /**
   * 커미션 ID로 조회 (없으면 예외)
   * @param id - 커미션 ID (BigInt)
   * @returns 커미션 엔티티
   * @throws {CommissionNotFoundException} 커미션이 없는 경우
   */
  getById(id: bigint): Promise<AffiliateCommission>;

  /**
   * 어필리에이트의 커미션 목록 조회
   * @param affiliateId - 어필리에이트 ID
   * @param options - 조회 옵션 (상태, 통화, 날짜 범위 등)
   * @returns 커미션 엔티티 배열
   */
  findByAffiliateId(
    affiliateId: bigint,
    options?: {
      status?: CommissionStatus;
      currency?: ExchangeCurrencyCode;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    },
  ): Promise<AffiliateCommission[]>;

  /**
   * 어필리에이트의 커미션 개수 조회
   * @param affiliateId - 어필리에이트 ID
   * @param options - 조회 옵션
   * @returns 커미션 개수
   */
  countByAffiliateId(
    affiliateId: bigint,
    options?: {
      status?: CommissionStatus;
      currency?: ExchangeCurrencyCode;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<number>;

  /**
   * 정산 대기 중인 커미션 조회 (PENDING 상태)
   * @param affiliateId - 어필리에이트 ID
   * @param currency - 통화 코드
   * @param options - 조회 옵션 (페이지네이션)
   * @returns 커미션 엔티티 배열
   */
  findPendingByAffiliateId(
    affiliateId: bigint,
    currency: ExchangeCurrencyCode,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<AffiliateCommission[]>;

  /**
   * 게임 라운드 ID로 커미션 조회
   * @param gameRoundId - 게임 라운드 ID (BigInt)
   * @returns 커미션 엔티티 또는 null
   */
  findByGameRoundId(gameRoundId: bigint): Promise<AffiliateCommission | null>;

  /**
   * 커미션 생성
   * @param commission - 커미션 엔티티
   * @returns 생성된 커미션 엔티티
   */
  create(commission: AffiliateCommission): Promise<AffiliateCommission>;

  /**
   * 커미션 상태 업데이트
   * @param id - 커미션 ID (BigInt)
   * @param createdAt - 생성일 (복합 PK용)
   * @param status - 새로운 상태
   * @param settlementDate - 정산일 (선택적)
   * @param claimedAt - 출금 요청일 (선택적)
   * @param withdrawnAt - 출금 완료일 (선택적)
   * @returns 업데이트된 커미션 엔티티
   */
  updateStatus(
    id: bigint,
    createdAt: Date,
    status: CommissionStatus,
    settlementDate?: Date | null,
    claimedAt?: Date | null,
    withdrawnAt?: Date | null,
  ): Promise<AffiliateCommission>;

  /**
   * 일괄 정산 처리 (PENDING → AVAILABLE)
   * @param commissionIds - 정산할 커미션 ID 목록 (bigint)
   * @param settlementDate - 정산일
   * @returns 업데이트된 커미션 개수
   */
  settlePendingCommissions(
    commissionIds: bigint[],
    settlementDate: Date,
  ): Promise<number>;

  /**
   * PENDING 상태 커미션이 있는 어필리에이트 ID 목록 조회
   * @param options - 조회 옵션 (페이지네이션)
   * @returns 어필리에이트 ID 배열 (중복 제거)
   */
  findAffiliateIdsWithPendingCommissions(options?: {
    limit?: number;
    offset?: number;
  }): Promise<bigint[]>;
}
