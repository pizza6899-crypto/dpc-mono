// src/modules/promotion/ports/promotion.repository.port.ts
import type { Promotion, UserPromotion, PromotionCurrencyRule, PromotionTranslation } from '../domain';
import type { Prisma, ExchangeCurrencyCode, Language, PromotionTargetType, PromotionResetType } from '@prisma/client';

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
   * 타입별 활성 프로모션 조회
   */
  findByTargetType(targetType: PromotionTargetType, now?: Date): Promise<Promotion[]>;

  /**
   * 사용자의 모든 프로모션 조회
   */
  findUserPromotions(userId: bigint, status?: string): Promise<UserPromotion[]>;

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
  hasUserUsedPromotion(userId: bigint, promotionId: bigint): Promise<boolean>;

  /**
   * 사용자의 완료된 입금 횟수 조회
   */
  countCompletedDeposits(userId: bigint): Promise<number>;

  /**
   * 사용자의 완료된 출금 횟수 조회
   */
  countCompletedWithdrawals(userId: bigint): Promise<number>;

  /**
   * 특정 기간 내 사용자의 프로모션 참여 횟수 조회
   */
  countUserPromotionsInPeriod(params: {
    userId: bigint;
    promotionId: bigint;
    startDate: Date;
    endDate?: Date;
  }): Promise<number>;

  /**
   * UserPromotion 생성
   */
  createUserPromotion(params: {
    userId: bigint;
    promotionId: bigint;
    depositId: bigint;
    wageringRequirementId?: bigint;
    depositAmount: Prisma.Decimal;
    bonusAmount: Prisma.Decimal;
    currency: ExchangeCurrencyCode;
    policySnapshot: any;
  }): Promise<UserPromotion>;

  /**
   * 사용자가 이전 입금이 있는지 확인 (DEPRECATED: countCompletedDeposits 사용 권장)
   */
  hasPreviousDeposits(userId: bigint): Promise<boolean>;

  /**
   * 관리자용 프로모션 목록 조회
   */
  findManyForAdmin(params: {
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'id';
    sortOrder?: 'asc' | 'desc';
    id?: bigint;
    isActive?: boolean;
    targetType?: PromotionTargetType;
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
    isActive?: boolean;
    startDate?: Date | null;
    endDate?: Date | null;
    targetType: PromotionTargetType;
    maxUsageCount?: number | null;
    maxUsagePerUser?: number | null;
    periodicResetType?: PromotionResetType;
    applicableDays?: number[];
    applicableStartTime?: Date | null;
    applicableEndTime?: Date | null;
    bonusExpiryMinutes?: number | null;
  }): Promise<Promotion>;

  /**
   * 프로모션 업데이트
   */
  update(id: bigint, params: Partial<Prisma.PromotionUpdateInput>): Promise<Promotion>;


  /**
   * 프로모션 사용 횟수 증가 (Atomic)
   */
  incrementUsageCount(id: bigint): Promise<Promotion>;

  /**
   * 프로모션의 통화별 규칙 조회
   */
  getCurrencyRule(
    promotionId: bigint,
    currency: ExchangeCurrencyCode,
  ): Promise<PromotionCurrencyRule | null>;

  /**
   * 프로모션의 통화별 규칙 생성 또는 업데이트
   */
  upsertCurrencySettings(params: {
    promotionId: bigint;
    currency: ExchangeCurrencyCode;
    minDepositAmount: Prisma.Decimal;
    maxDepositAmount?: Prisma.Decimal | null;
    maxBonusAmount?: Prisma.Decimal | null;
    maxWithdrawAmount?: Prisma.Decimal | null;
    bonusRate?: Prisma.Decimal | null;
    wageringMultiplier?: Prisma.Decimal | null;
  }): Promise<void>;


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
   * 프로모션 번역 생성 또는 업데이트
   */
  upsertTranslation(params: {
    promotionId: bigint;
    language: Language;
    title: string;
    description?: string | null;
  }): Promise<PromotionTranslation>;

}
