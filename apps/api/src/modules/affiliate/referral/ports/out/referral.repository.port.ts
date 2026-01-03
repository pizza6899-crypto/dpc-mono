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
   * 어플리에이트별 레퍼럴 개수 조회
   */
  countByAffiliateId(affiliateId: bigint): Promise<number>;
}
