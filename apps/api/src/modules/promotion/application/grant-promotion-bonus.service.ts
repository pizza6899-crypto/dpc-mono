// src/modules/promotion/application/grant-promotion-bonus.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Prisma, ExchangeCurrencyCode } from '@prisma/client';
import { PromotionPolicy, PromotionNotFoundException } from '../domain';
import type { Promotion, UserPromotion } from '../domain';
import { PROMOTION_REPOSITORY } from '../ports/out';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';
import { CreateWageringRequirementService } from '../../wagering/application/create-wagering-requirement.service';
import { UpdateUserBalanceService } from '../../wallet/application/update-user-balance.service';
import { UpdateOperation } from '../../wallet/domain';
import { WalletBalanceType, WalletTransactionType } from '@prisma/client';
import type { RequestClientInfo } from 'src/common/http/types';

interface GrantPromotionBonusParams {
  userId: bigint;
  promotionId: bigint;
  depositAmount: Prisma.Decimal;
  currency: ExchangeCurrencyCode;
  depositDetailId: bigint;
  now?: Date;
  requestInfo?: RequestClientInfo;
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
    private readonly createWageringRequirementService: CreateWageringRequirementService,
    private readonly updateUserBalanceService: UpdateUserBalanceService,
  ) { }

  @Transactional()
  async execute({
    userId,
    promotionId,
    depositAmount,
    currency,
    depositDetailId,
    now = new Date(),
    requestInfo,
  }: GrantPromotionBonusParams): Promise<GrantPromotionBonusResult> {
    // 0. 락 획득 (동시성 제어)
    await this.repository.acquireLock(userId);

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

    // 사용 횟수 증가 (Atomic)
    // 동시성 제어를 위해 DB에서 원자적으로 증가시키고 결과를 확인
    const updatedPromotion = await this.repository.incrementUsageCount(promotionId);

    if (
      updatedPromotion.maxUsageCount !== null &&
      updatedPromotion.currentUsageCount > updatedPromotion.maxUsageCount
    ) {
      // 선착순 마감됨 (트랜잭션 롤백)
      // TODO: 정확한 에러 타입 정의 필요
      throw new Error('Promotion usage limit exceeded');
    }

    // 만료 시간 계산
    let expiresAt: Date | null = null;
    if (promotion.bonusExpiryMinutes) {
      expiresAt = new Date(now.getTime() + promotion.bonusExpiryMinutes * 60 * 1000);
    }

    // UserPromotion 생성 (Policy에서 이미 중복 참여 검증 완료)
    // 1회성 프로모션이 아닌 경우 여러 번 참여 가능
    userPromotion = await this.repository.createUserPromotion({
      userId,
      promotionId,
      depositAmount,
      lockedAmount: depositAmount, // 기본적으로 입금 원금을 잠금
      bonusAmount,
      targetRollingAmount,
      currency,
      expiresAt,
    });

    // 2. 지갑에 보너스 지급 (Wallet Update)
    if (bonusAmount.gt(0)) {
      await this.updateUserBalanceService.updateBalance({
        userId,
        currency,
        amount: bonusAmount,
        operation: UpdateOperation.ADD,
        balanceType: WalletBalanceType.BONUS,
        transactionType: WalletTransactionType.BONUS_IN,
        referenceId: userPromotion.id.toString(),
      }, {
        internalNote: `Promotion bonus granted: ${promotion.managementName}`,
        actionName: 'GRANT_PROMOTION_BONUS',
      });
    }

    // 롤링 생성 (보너스 금액에만 롤링 적용)
    let rollingCreated = false;
    if (targetRollingAmount.gt(0)) {
      await this.createWageringRequirementService.execute({
        userId,
        currency,
        sourceType: 'PROMOTION_BONUS',
        requiredAmount: targetRollingAmount,
        depositDetailId,
        userPromotionId: BigInt(userPromotion.id),
        requestInfo,
      });
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

