// src/modules/promotion/application/check-eligible-promotions.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Prisma, ExchangeCurrencyCode } from '@prisma/client';
import type { Promotion } from '../domain';
import { PROMOTION_REPOSITORY } from '../ports/out';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';

interface CheckEligiblePromotionsParams {
  userId: bigint;
  depositAmount: Prisma.Decimal;
  currency: ExchangeCurrencyCode;
  now?: Date;
}

@Injectable()
export class CheckEligiblePromotionsService {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
  ) { }

  async execute({
    userId,
    depositAmount,
    currency,
    now = new Date(),
  }: CheckEligiblePromotionsParams): Promise<Promotion[]> {
    // 활성 프로모션 조회
    const activePromotions = await this.repository.findActivePromotions(now);

    // 사용자 정보 확인
    const hasPreviousDeposits =
      await this.repository.hasPreviousDeposits(userId);
    const hasWithdrawn = await this.repository.hasWithdrawn(userId);

    // 각 프로모션에 대해 자격 확인
    const eligiblePromotions: Promotion[] = [];

    for (const promotion of activePromotions) {
      try {
        // 통화별 설정 조회
        const currencySettings = await this.repository.getCurrencySettings(
          promotion.id,
          currency,
        );

        // 최소 입금 금액 확인
        // 입금 필수일 경우에만 체크, 비입금 쿠폰은 패스
        if (promotion.isDepositRequired) {
          if (depositAmount.lt(currencySettings.minDepositAmount)) {
            continue;
          }
        }

        // 선착순 마감 확인
        if (
          promotion.maxUsageCount !== null &&
          promotion.currentUsageCount >= promotion.maxUsageCount
        ) {
          continue;
        }

        // 타겟 타입별 자격 확인
        const targetType = promotion.targetType as string;

        if (targetType === 'NEW_USER_FIRST_DEPOSIT') {
          if (hasPreviousDeposits) {
            continue;
          }
        } else if (targetType === 'SPECIFIC_USERS') {
          const isAllowed = await this.repository.isUserAllowed(
            promotion.id,
            userId,
          );
          if (!isAllowed) {
            continue;
          }
        }
        // ALL_USERS는 추가 체크 없음

        // 1회성 프로모션 확인
        if (promotion.isOneTime) {
          const existingUserPromotion = await this.repository.findUserPromotion(
            userId,
            promotion.id,
          );
          if (existingUserPromotion?.bonusGranted) {
            continue;
          }
        }

        eligiblePromotions.push(promotion);
      } catch (error) {
        // 자격 미달 프로모션은 무시
        continue;
      }
    }

    return eligiblePromotions;
  }
}

