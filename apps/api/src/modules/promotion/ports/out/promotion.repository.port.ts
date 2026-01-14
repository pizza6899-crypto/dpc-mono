// src/modules/promotion/ports/out/promotion.repository.port.ts
import type { Promotion, UserPromotion, PromotionCurrency } from '../../domain';
import type { PromotionTranslation } from '../../domain/model/promotion.entity';
import { Prisma, ExchangeCurrencyCode, Language } from '@repo/database';

export interface PromotionRepositoryPort {
  /**
   * 활성 프로모션 조회 (현재 시간 기준)
   */
  findActivePromotions(now?: Date): Promise<Promotion[]>;

  /**
   * 활성 프로모션 조회 (페이지네이션 지원)
   */
  findActivePromotionsPaginated(params: {
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'id';
    sortOrder?: 'asc' | 'desc';
    now?: Date;
  }): Promise<{
    promotions: Promotion[];
    total: number;
  }>;

  /**
   * ID로 프로모션 조회
   */
  findById(id: bigint): Promise<Promotion | null>;

  /**
   * Code로 프로모션 조회
   */
  findByCode(code: string): Promise<Promotion | null>;

  /**
   * 타입별 활성 프로모션 조회
   */
  findByTargetType(
    targetType: string,
    now?: Date,
  ): Promise<Promotion[]>;

  /**
   * 사용자의 프로모션 조회
   */
  findUserPromotion(
    userId: bigint,
    promotionId: bigint,
  ): Promise<UserPromotion | null>;

  /**
   * 사용자의 모든 프로모션 조회
   */
  findUserPromotions(
    userId: bigint,
    status?: string,
  ): Promise<UserPromotion[]>;

  /**
   * 사용자의 프로모션 조회 (페이지네이션 지원)
   */
  findUserPromotionsPaginated(params: {
    userId: bigint;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'id';
    sortOrder?: 'asc' | 'desc';
    status?: string;
  }): Promise<{
    userPromotions: UserPromotion[];
    total: number;
  }>;

  /**
   * 사용자가 특정 프로모션을 사용했는지 확인
   */
  hasUserUsedPromotion(
    userId: bigint,
    promotionId: bigint,
  ): Promise<boolean>;

  /**
   * UserPromotion 생성
   */
  createUserPromotion(params: {
    userId: bigint;
    promotionId: bigint;
    depositAmount: Prisma.Decimal;
    lockedAmount: Prisma.Decimal;
    bonusAmount: Prisma.Decimal;
    targetRollingAmount: Prisma.Decimal;
    currency: ExchangeCurrencyCode;
    expiresAt?: Date | null;
  }): Promise<UserPromotion>;

  /**
   * UserPromotion 업데이트
   */
  updateUserPromotion(
    userPromotion: UserPromotion,
  ): Promise<UserPromotion>;

  /**
   * 사용자가 이전 입금이 있는지 확인
   */
  hasPreviousDeposits(userId: bigint): Promise<boolean>;

  /**
   * 사용자가 출금한 적이 있는지 확인
   */
  hasWithdrawn(userId: bigint): Promise<boolean>;

  /**
   * 사용자가 프로모션 화이트리스트에 포함되어 있는지 확인
   */
  isUserAllowed(promotionId: bigint, userId: bigint): Promise<boolean>;

  /**
   * 관리자용 프로모션 목록 조회
   */
  findManyForAdmin(params: {
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'id';
    sortOrder?: 'asc' | 'desc';
    isActive?: boolean;
    targetType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    promotions: Promotion[];
    total: number;
  }>;

  /**
   * 프로모션 생성
   */
  create(params: {
    managementName: string;
    isActive?: boolean;
    startDate?: Date | null;
    endDate?: Date | null;
    code?: string | null;
    targetType: string;
    bonusType: string;
    bonusRate?: Prisma.Decimal | null;
    rollingMultiplier?: Prisma.Decimal | null;
    qualificationMaintainCondition: string;
    isOneTime?: boolean;
    isDepositRequired?: boolean;
    maxUsageCount?: number | null;
    bonusExpiryMinutes?: number | null;
    note?: string[];
    targetUserIds?: bigint[];
  }): Promise<Promotion>;

  /**
   * 프로모션 업데이트
   */
  update(promotion: Partial<Promotion> & { id: bigint }): Promise<Promotion>;

  /**
   * 프로모션 삭제
   */
  delete(id: bigint): Promise<void>;

  /**
   * PostgreSQL Advisory Lock을 사용하여 사용자별 프로모션 처리에 대한 락을 획득합니다.
   * 트랜잭션 종료 시 자동 해제됩니다.
   */
  acquireLock(userId: bigint): Promise<void>;

  /**
   * 프로모션 사용 횟수 증가 (Atomic)
   * 증가 후의 최신 프로모션 상태를 반환
   */
  incrementUsageCount(id: bigint): Promise<Promotion>;

  /**
   * 프로모션의 통화별 설정 조회
   * 통화별 설정이 없으면 에러 발생 (통화별 설정은 필수)
   */
  getCurrencySettings(
    promotionId: bigint,
    currency: ExchangeCurrencyCode,
  ): Promise<PromotionCurrency>;

  /**
   * 프로모션의 통화별 설정 생성 또는 업데이트
   */
  upsertCurrencySettings(params: {
    promotionId: bigint;
    currency: ExchangeCurrencyCode;
    minDepositAmount: Prisma.Decimal;
    maxBonusAmount?: Prisma.Decimal | null;
    maxWithdrawAmount?: Prisma.Decimal | null;
  }): Promise<void>;

  /**
   * 프로모션의 통화별 설정 삭제
   */
  deleteCurrencySettings(
    promotionId: bigint,
    currency: ExchangeCurrencyCode,
  ): Promise<void>;

  /**
   * 프로모션별 UserPromotion 목록 조회 (관리자용)
   */
  findUserPromotionsByPromotionId(params: {
    promotionId: bigint;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'id';
    sortOrder?: 'asc' | 'desc';
    status?: string;
    userId?: bigint;
  }): Promise<{
    userPromotions: Array<{
      userPromotion: UserPromotion;
      user: {
        id: bigint;
        email: string | null;
      } | null;
    }>;
    total: number;
  }>;

  /**
   * 프로모션별 참가자 통계 조회
   */
  getPromotionStatistics(promotionId: bigint): Promise<{
    totalParticipants: number;
    statusCounts: Record<string, number>;
  }>;



  /**
   * 프로모션 번역 일괄 생성
   */
  createTranslations(
    promotionId: bigint,
    translations: Array<{
      language: Language;
      name: string;
      description?: string | null;
    }>,
  ): Promise<PromotionTranslation[]>;



  /**
   * 프로모션 번역 생성 또는 업데이트
   */
  upsertTranslation(params: {
    promotionId: bigint;
    language: Language;
    name: string;
    description?: string | null;
  }): Promise<PromotionTranslation>;

  /**
   * 프로모션 번역 삭제
   */
  deleteTranslation(
    promotionId: bigint,
    language: Language,
  ): Promise<void>;
}

