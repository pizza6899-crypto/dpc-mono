// src/modules/promotion/campaign/application/process-deposit-promotion.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Prisma, ExchangeCurrencyCode, RewardSourceType, RewardItemType } from '@prisma/client';
import { InstantGrantRewardService } from 'src/modules/reward/core/application/instant-grant-reward.service';
import { RewardMetadataType } from 'src/modules/reward/core/domain/reward.types';
import { GrantPromotionBonusService } from './grant-promotion-bonus.service';
import { GetPromotionConfigService } from '../../config/application/get-promotion-config.service';
import type { RequestClientInfo } from 'src/common/http/types';
import Decimal from 'decimal.js';

export interface ProcessDepositPromotionParams {
  userId: bigint;
  depositId: bigint;
  amount: Prisma.Decimal;
  currency: ExchangeCurrencyCode;
  promotionId?: bigint;
  adminId: bigint;
  memo?: string;
  requestInfo: RequestClientInfo;
}

@Injectable()
export class ProcessDepositPromotionService {
  private readonly logger = new Logger(ProcessDepositPromotionService.name);

  constructor(
    private readonly grantPromotionBonusService: GrantPromotionBonusService,
    private readonly instantGrantRewardService: InstantGrantRewardService,
    private readonly getPromotionConfigService: GetPromotionConfigService,
  ) { }

  @Transactional()
  async execute(params: ProcessDepositPromotionParams): Promise<{ bonusAmount: Prisma.Decimal }> {
    const { userId, depositId, amount, currency, promotionId, adminId, memo, requestInfo } = params;

    let bonusAmount = new Prisma.Decimal(0);
    let multiplier = new Prisma.Decimal(1);

    // 1. 보너스 및 배수 결정
    if (promotionId) {
      // 프로모션 참여 처리 및 보너스 정보 획득
      const userPromotion = await this.grantPromotionBonusService.execute({
        userId,
        promotionId,
        depositAmount: amount,
        currency,
        depositDetailId: depositId,
      });

      bonusAmount = userPromotion.bonusAmount;
      multiplier = new Prisma.Decimal(
        userPromotion.policySnapshot.wageringMultiplier ?? 1,
      );
    } else {
      // 프로모션이 없는 경우: 기본 AML 롤링 설정 적용
      const config = await this.getPromotionConfigService.execute();
      multiplier = config.defaultAmlDepositMultiplier;
    }

    // 2. 리워드 모듈을 통한 즉시 지급 처리
    // 리워드 모듈이 지갑 업데이트와 롤링 생성을 담당합니다.
    await this.instantGrantRewardService.execute({
      userId,
      sourceType: RewardSourceType.PROMOTION_BONUS,
      sourceId: promotionId,
      rewardType: RewardItemType.BONUS_MONEY,
      currency,
      amount: new Decimal(bonusAmount.toString()),
      wageringMultiplier: new Decimal(multiplier.toString()),
      isForfeitable: !!promotionId,
      metadata: {
        type: RewardMetadataType.PROMOTION,
        depositAmount: amount.toString(),
        depositId: depositId.toString(),
        promotionId: promotionId?.toString(),
      },
    });

    this.logger.log(`Processed deposit promotion: userId=${userId}, depositId=${depositId}, bonus=${bonusAmount}`);

    return { bonusAmount };
  }
}
