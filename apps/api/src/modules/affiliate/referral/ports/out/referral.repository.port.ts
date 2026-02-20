// src/modules/affiliate/referral/ports/out/referral.repository.port.ts
import type { Referral } from '../../domain';

export interface ReferralRepositoryPort {
  /**
   * 레퍼럴 관계 생성
   */
  create(params: {
    affiliateId: bigint;
    codeId: bigint;
    subUserId: bigint;
    ipAddress?: string | null;
    deviceFingerprint?: string | null;
    userAgent?: string | null;
  }): Promise<Referral>;

  /**
   * UID로 레퍼럴 조회 (사용자용)
   */
  findByUid(uid: string): Promise<Referral | null>;

  /**
   * UID로 레퍼럴 조회 (없으면 예외 발생)
   */
  getByUid(uid: string): Promise<Referral>;

  /**
   * 어플리에이트별 레퍼럴 목록 조회
   */
  findByAffiliateId(affiliateId: bigint): Promise<Referral[]>;

  /**
   * 피추천인별 레퍼럴 조회 (중복 방지용)
   */
  findBySubUserId(subUserId: bigint): Promise<Referral | null>;

  /**
   * 코드별 레퍼럴 목록 조회
   */
  findByCodeId(codeId: bigint): Promise<Referral[]>;

  /**
   * 어플리에이트와 피추천인으로 레퍼럴 조회 (중복 체크용)
   */
  findByAffiliateAndSubUser(
    affiliateId: bigint,
    subUserId: bigint,
  ): Promise<Referral | null>;

  /**
   * 관리자용 레퍼럴 목록 조회 (페이징, 필터링 지원)
   * Repository에서 Join된 데이터를 반환하지 않고, Domain Entity로 변환하여 반환
   * (단, AdminList DTO 구성을 위해 필요한 연관 데이터는 Service에서 해결하거나,
   *  Domain Entity가 연관 ID를 가지고 있으므로 Service에서 추가 조회/매핑하는 것이 정석이나,
   *  성능상 Join이 필요한 경우 Repository에서 DTO에 맞는 구조체나 확장된 도메인 모델을 반환해야 함.
   *  여기서는 일단 Domain Entity 기본 반환 + 필요한 경우 확장)
   *
   *  Design Decision: Admin List needs email/code info which are in relations.
   *  Strictly speaking, Repository should return Aggregates.
   *  But for Admin Read Model, we often need "Views".
   *  Let's define a return type that includes necessary info, or keep it strict and let service handle it?
   *  Service handling it means N+1 or multiple queries.
   *  Let's allow Repository to return a structure closer to what's needed, or use a separate QueryHandler.
   *  For now, let's keep it simple and return the "Populated" structure or similar.
   *  Actually, to stick to Architecture, Repository returns Domain Entities.
   *  But Admin needs joined data (email).
   *  Let's define a specific type for Admin Result.
   */
  findManyForAdmin(params: {
    page?: number;
    limit?: number;
    sortBy?: 'createdAt';
    sortOrder?: 'asc' | 'desc';
    affiliateId?: bigint;
    subUserId?: bigint;
    codeId?: bigint;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    referrals: Array<
      Referral & {
        affiliateEmail: string;
        subUserEmail: string;
        codeValue: string;
        campaignName?: string | null;
      }
    >;
    total: number;
  }>;
  /**
   * 어플리에이트별 레퍼럴 개수 조회
   */
  countByAffiliateId(affiliateId: bigint): Promise<number>;

  /**
   * 관리자용 레퍼럴 상세 조회
   */
  findByIdForAdmin(id: bigint): Promise<
    | (Referral & {
        affiliateEmail: string;
        subUserEmail: string;
        codeValue: string;
        campaignName?: string | null;
      })
    | null
  >;
}
