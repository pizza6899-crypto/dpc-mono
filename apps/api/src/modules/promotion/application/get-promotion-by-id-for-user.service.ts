// src/modules/promotion/application/get-promotion-by-id-for-user.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Language } from '@repo/database';
import { PromotionNotFoundException } from '../domain';
import { PROMOTION_REPOSITORY } from '../ports/out';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';
import type { PromotionResponseDto } from '../controllers/user/dto/response/promotion.response.dto';

interface GetPromotionByIdForUserParams {
  id: bigint;
  language?: Language;
}

@Injectable()
export class GetPromotionByIdForUserService {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
  ) {}

  async execute(
    params: GetPromotionByIdForUserParams,
  ): Promise<PromotionResponseDto> {
    const { id, language = Language.EN } = params;

    const promotion = await this.repository.findById(id);
    if (!promotion) {
      throw new PromotionNotFoundException(id);
    }

    const translations = promotion.getTranslations();
    const currencies = promotion.getCurrencies();
    const currentTranslation = translations?.find(
      (t) => t.language === language,
    );
    const currentCurrency = currencies?.[0];

    // 번역과 통화 정보가 모두 있어야 노출
    if (!currentTranslation || !currentCurrency) {
      throw new PromotionNotFoundException(id);
    }

    return {
      uid: promotion.uid,
      name: currentTranslation.name,
      description: currentTranslation.description ?? null,
      language: currentTranslation.language,
      currency: currentCurrency.currency,
      minDepositAmount: currentCurrency.minDepositAmount.toString(),
      maxBonusAmount: currentCurrency.maxBonusAmount
        ? currentCurrency.maxBonusAmount.toString()
        : null,
      targetType: promotion.targetType as string,
      bonusType: promotion.bonusType as string,
      bonusRate: promotion.bonusRate
        ? promotion.bonusRate.toString()
        : undefined,
      rollingMultiplier: promotion.rollingMultiplier
        ? promotion.rollingMultiplier.toString()
        : undefined,
      isOneTime: promotion.isOneTime,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
    };
  }
}

