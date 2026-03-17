// src/modules/promotion/campaign/application/grant-promotion-bonus.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Prisma, ExchangeCurrencyCode } from '@prisma/client';
import {
  PromotionPolicy,
  PromotionNotFoundException,
} from '../domain';
import type { UserPromotion } from '../domain';
import { PROMOTION_REPOSITORY } from '../ports';
import type { PromotionRepositoryPort } from '../ports/promotion.repository.port';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';

interface GrantPromotionBonusParams {
  userId: bigint;
  promotionId: bigint;
  depositAmount: Prisma.Decimal;
  currency: ExchangeCurrencyCode;
  depositDetailId: bigint;
}

@Injectable()
export class GrantPromotionBonusService {
  private readonly logger = new Logger(GrantPromotionBonusService.name);

  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
    private readonly policy: PromotionPolicy,
    private readonly advisoryLockService: AdvisoryLockService,
  ) { }

  @Transactional()
  async execute({
    userId,
    promotionId,
    depositAmount,
    currency,
    depositDetailId,
  }: GrantPromotionBonusParams): Promise<UserPromotion> {
    // 락 획득
    await this.advisoryLockService.acquireLock(
      LockNamespace.PROMOTION,
      userId.toString(),
      { throwThrottleError: true },
    );

    const promotion = await this.repository.findById(promotionId);
    if (!promotion) {
      throw new PromotionNotFoundException();
    }

    const currencyRule = await this.repository.getCurrencyRule(promotionId, currency);
    if (!currencyRule) {
      throw new PromotionNotFoundException(); // 통화 규칙 없으면 참여 불가
    }

    const now = new Date();
    const periodStart = promotion.getCurrentPeriodStartDate(now);

    const [
      depositCount,
      withdrawalCount,
      participationCountInPeriod,
      activeParticipations,
    ] = await Promise.all([
      this.repository.countCompletedDeposits(userId),
      this.repository.countCompletedWithdrawals(userId),
      this.repository.countUserPromotionsInPeriod({
        userId,
        promotionId,
        startDate: periodStart,
      }),
      this.repository.findUserPromotions(userId, 'ACTIVE'),
    ]);

    // 자격 검증
    this.policy.validateEligibility({
      promotion,
      currencyRule,
      depositAmount,
      depositCount,
      withdrawalCount,
      participationCountInPeriod,
      activeParticipations,
      now,
    });

    // 보너스 계산 (Rule 엔티티 내부 로직 사용)
    const bonusAmount = currencyRule.calculateBonusAmount(depositAmount);

    // 사용 횟수 증가 (Atomicity는 DB 레벨에서 보장한다고 가정하거나 incrementUsageCount 사용)
    await this.repository.incrementUsageCount(promotionId);

    // 정책 스냅샷 생성
    const policySnapshot = {
      bonusRate: currencyRule.bonusRate?.toNumber() ?? null,
      wageringMultiplier: currencyRule.wageringMultiplier?.toNumber() ?? null,
      maxWithdrawAmount: currencyRule.maxWithdrawAmount?.toNumber() ?? null,
      isForfeitable: true, // 기본값
    };

    // UserPromotion 생성
    const userPromotion = await this.repository.createUserPromotion({
      userId,
      promotionId,
      depositId: depositDetailId,
      depositAmount,
      bonusAmount,
      currency,
      policySnapshot,
    });

    this.logger.log(
      `Promotion bonus granted: userId=${userId}, promotionId=${promotionId}, bonus=${bonusAmount.toString()}`,
    );

    return userPromotion;
  }
}
