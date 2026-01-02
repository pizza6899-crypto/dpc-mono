// src/modules/promotion/application/grant-promotion-bonus.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectTransaction, Transactional } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Prisma, ExchangeCurrencyCode } from '@repo/database';
import { PromotionPolicy, PromotionNotFoundException } from '../domain';
import type { Promotion, UserPromotion } from '../domain';
import { PROMOTION_REPOSITORY } from '../ports/out';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';
import { RollingService } from '../../rolling/application/rolling.service';

interface GrantPromotionBonusParams {
  userId: bigint;
  promotionId: bigint;
  depositAmount: Prisma.Decimal;
  currency: ExchangeCurrencyCode;
  depositDetailId: bigint;
  now?: Date;
}

interface GrantPromotionBonusResult {
  userPromotion: UserPromotion;
  bonusAmount: Prisma.Decimal;
  rollingCreated: boolean;
}

@Injectable()
export class GrantPromotionBonusService {
  private readonly logger = new Logger(GrantPromotionBonusService.name);

  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
    private readonly policy: PromotionPolicy,
    private readonly rollingService: RollingService,
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
  ) {}

  @Transactional()
  async execute({
    userId,
    promotionId,
    depositAmount,
    currency,
    depositDetailId,
    now = new Date(),
  }: GrantPromotionBonusParams): Promise<GrantPromotionBonusResult> {
    // 프로모션 조회
    const promotion = await this.repository.findById(promotionId);
    if (!promotion) {
      throw new PromotionNotFoundException(promotionId);
    }

    // 통화별 설정 조회
    const currencySettings = await this.repository.getCurrencySettings(
      promotionId,
      currency,
    );

    // 사용자 정보 확인
    const hasPreviousDeposits =
      await this.repository.hasPreviousDeposits(userId);
    const hasWithdrawn = await this.repository.hasWithdrawn(userId);

    // 기존 UserPromotion 조회
    let userPromotion =
      await this.repository.findUserPromotion(userId, promotionId);

    // 자격 검증 (통화별 설정 사용)
    this.policy.validateEligibility(
      promotion,
      depositAmount,
      currencySettings,
      userPromotion,
      hasPreviousDeposits,
      hasWithdrawn,
      now,
    );

    // 보너스 계산 (통화별 maxBonusAmount 사용)
    const bonusAmount = promotion.calculateBonus(
      depositAmount,
      currencySettings.maxBonusAmount,
    );

    // 최대 보너스 금액 검증
    if (!currencySettings.validateMaxBonusAmount(bonusAmount)) {
      throw new Error(
        `Bonus amount ${bonusAmount.toString()} exceeds maximum ${currencySettings.maxBonusAmount?.toString()}`,
      );
    }

    // 롤링 배수 계산 (보너스 금액에만 롤링 적용)
    const rollingMultiplier = promotion.getRollingMultiplier();
    const targetRollingAmount = bonusAmount.mul(rollingMultiplier);

    // UserPromotion 생성 (Policy에서 이미 중복 참여 검증 완료)
    // 1회성 프로모션이 아닌 경우 여러 번 참여 가능
    userPromotion = await this.repository.createUserPromotion({
      userId,
      promotionId,
      depositAmount,
      bonusAmount,
      targetRollingAmount,
      currency,
    });

    // 롤링 생성 (보너스 금액에만 롤링 적용)
    let rollingCreated = false;
    if (promotion.rollingMultiplier && bonusAmount.gt(0)) {
      await this.rollingService.createPromotionRolling(
        this.tx,
        userId,
        bonusAmount,
        userPromotion.id,
        rollingMultiplier,
      );
      rollingCreated = true;
    }

    this.logger.log(
      `Promotion bonus granted: userId=${userId}, promotionId=${promotionId}, bonusAmount=${bonusAmount.toString()}`,
    );

    return {
      userPromotion,
      bonusAmount,
      rollingCreated,
    };
  }
}

