import { Inject, Injectable } from '@nestjs/common';
import { Language, ExchangeCurrencyCode } from '@prisma/client';
import { PromotionNotFoundException, Promotion, PromotionTranslation } from '../domain';
import { PROMOTION_REPOSITORY } from '../ports/out';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';
import { PromotionCurrency } from '../domain/model/promotion-currency.entity';

interface GetPromotionByCodeForUserParams {
  code: string;
  language?: Language;
  currency?: ExchangeCurrencyCode;
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
    const { code, language = Language.EN, currency } = params;

    const promotion = await this.repository.findByCode(code);
    if (!promotion) {
      throw new PromotionNotFoundException();
    }

    const translations = promotion.getTranslations();
    const currencies = promotion.getCurrencies();
    const currentTranslation = translations?.find(
      (t) => t.language === language,
    );

    let currentCurrency = currencies?.find((c) => c.currency === currency);
    if (!currentCurrency) {
      currentCurrency = currencies?.[0];
    }

    // 번역과 통화 정보가 모두 있어야 노출
    if (!currentTranslation || !currentCurrency) {
      throw new PromotionNotFoundException();
    }

    return {
      promotion,
      translation: currentTranslation,
      currencySetting: currentCurrency,
    };
  }
}
