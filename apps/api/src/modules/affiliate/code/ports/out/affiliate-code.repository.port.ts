// src/modules/affiliate/code/ports/out/affiliate-code.repository.port.ts
import type { AffiliateCode } from '../../domain';

export interface AffiliateCodeRepositoryPort {
  /**
   * 코드 생성 (ID는 Repository에서 자동 생성)
   */
  create(params: {
    uid: string;
    userId: bigint;
    code: string;
    campaignName?: string | null;
    isDefault?: boolean;
    expiresAt?: Date | null;
  }): Promise<AffiliateCode>;

  /**
   * 사용자별 코드 목록 조회 (페이징 지원)
   */
  findByUserId(
    userId: bigint,
    params?: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<AffiliateCode[]>;

  /**
   * ID로 코드 조회 (사용자용)
   */
  findById(id: bigint): Promise<AffiliateCode | null>;

  /**
   * 코드 문자열로 조회 (활성 코드만)
   */
  findByCode(code: string): Promise<AffiliateCode | null>;

  /**
   * 사용자별 코드 개수 조회
   */
  countByUserId(userId: bigint): Promise<number>;

  /**
   * 코드 존재 여부 확인 (코드 문자열로)
   */
  existsByCode(code: string): Promise<boolean>;

  /**
   * 기본 코드 조회
   */
  findDefaultByUserId(userId: bigint): Promise<AffiliateCode | null>;

  /**
   * 코드 업데이트
   */
  update(code: AffiliateCode): Promise<AffiliateCode>;

  /**
   * 코드 삭제 (UID 기준)
   */
  delete(uid: string, userId: bigint): Promise<void>;

  /**
   * 트랜잭션 내에서 여러 코드 업데이트
   */
  updateMany(updates: Array<{ code: AffiliateCode }>): Promise<AffiliateCode[]>;

  /**
   * 관리자용 코드 목록 조회 (페이징, 필터링 지원)
   */
  findManyForAdmin(params: {
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'code';
    sortOrder?: 'asc' | 'desc';
    userId?: bigint;
    code?: string;
    isActive?: boolean;
    isDefault?: boolean;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    codes: AffiliateCode[];
    total: number;
  }>;

  /**
   * 사용자 기반 락 획득 (경합 방지)
   */
  acquireLock(userId: bigint): Promise<void>;

  /**
   * ID로 코드 조회 (관리자용 - userId 없이 조회)
   */
  findByIdAdmin(id: bigint): Promise<AffiliateCode | null>;

  /**
   * 코드 삭제 (관리자용 - ID 기준)
   */
  deleteById(id: bigint): Promise<void>;
}
