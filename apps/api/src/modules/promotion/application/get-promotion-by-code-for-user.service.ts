// src/modules/promotion/application/get-promotion-by-code-for-user.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Language } from '@repo/database';
import { PromotionNotFoundException, Promotion, PromotionTranslation } from '../domain';
import { PROMOTION_REPOSITORY } from '../ports/out';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';
import { PromotionCurrency } from '../domain/model/promotion-currency.entity';

interface GetPromotionByCodeForUserParams {
  code: string;
  language?: Language;
}

export interface PromotionDetailInfo {
  promotion: Promotion;
  translation: PromotionTranslation;
  currencySetting: PromotionCurrency;
}

@Injectable()
export class GetPromotionByCodeForUserService {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
  ) { }

  async execute(
    params: GetPromotionByCodeForUserParams,
  ): Promise<PromotionDetailInfo> {
    const { code, language = Language.EN } = params;

    const promotion = await this.repository.findByCode(code);
    if (!promotion) {
      throw new PromotionNotFoundException(code);
    }

    const translations = promotion.getTranslations();
    const currencies = promotion.getCurrencies();
    const currentTranslation = translations?.find(
      (t) => t.language === language,
    );
    const currentCurrency = currencies?.[0];

    // 번역과 통화 정보가 모두 있어야 노출
    if (!currentTranslation || !currentCurrency) {
      throw new PromotionNotFoundException(code);
    }

    return {
      promotion,
      translation: currentTranslation,
      currencySetting: currentCurrency,
    };
  }
}
