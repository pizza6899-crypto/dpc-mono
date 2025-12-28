// src/modules/affiliate/code/ports/out/affiliate-code.repository.port.ts
import type { AffiliateCode } from '../../domain';

export interface AffiliateCodeRepositoryPort {
  /**
   * 코드 생성 (ID는 Repository에서 자동 생성)
   */
  create(params: {
    userId: string;
    code: string;
    campaignName?: string | null;
    isDefault?: boolean;
    expiresAt?: Date | null;
  }): Promise<AffiliateCode>;

  /**
   * 사용자별 코드 목록 조회
   */
  findByUserId(userId: string): Promise<AffiliateCode[]>;

  /**
   * ID로 코드 조회
   */
  findById(id: string, userId: string): Promise<AffiliateCode | null>;

  /**
   * 코드 문자열로 조회 (활성 코드만)
   */
  findByCode(code: string): Promise<AffiliateCode | null>;

  /**
   * 사용자별 코드 개수 조회
   */
  countByUserId(userId: string): Promise<number>;

  /**
   * 코드 존재 여부 확인 (코드 문자열로)
   */
  existsByCode(code: string): Promise<boolean>;

  /**
   * 기본 코드 조회
   */
  findDefaultByUserId(userId: string): Promise<AffiliateCode | null>;

  /**
   * 코드 업데이트
   */
  update(code: AffiliateCode): Promise<AffiliateCode>;

  /**
   * 코드 삭제
   */
  delete(id: string, userId: string): Promise<void>;

  /**
   * 트랜잭션 내에서 여러 코드 업데이트
   */
  updateMany(updates: Array<{ code: AffiliateCode }>): Promise<AffiliateCode[]>;
}
