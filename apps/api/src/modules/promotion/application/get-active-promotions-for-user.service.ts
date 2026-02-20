// src/modules/promotion/application/get-active-promotions-for-user.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Language, ExchangeCurrencyCode } from '@prisma/client';
import {
  Promotion,
  PromotionTranslation,
} from '../domain/model/promotion.entity';
import { PromotionCurrency } from '../domain/model/promotion-currency.entity';
import { PROMOTION_REPOSITORY } from '../ports/out';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';
import type { PaginatedData } from 'src/common/http/types/pagination.types';

interface GetActivePromotionsForUserParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'id';
  sortOrder?: 'asc' | 'desc';
  language?: Language;
  currency?: ExchangeCurrencyCode;
}

export interface ActivePromotionInfo {
  promotion: Promotion;
  translation: PromotionTranslation;
  currencySetting: PromotionCurrency;
}

@Injectable()
export class GetActivePromotionsForUserService {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
  ) {}

  async execute(
    params: GetActivePromotionsForUserParams & { userId?: bigint },
  ): Promise<PaginatedData<ActivePromotionInfo>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      language = Language.EN,
      currency = ExchangeCurrencyCode.USD,
      userId,
    } = params;

    const result = await this.repository.findActivePromotionsPaginated({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    const userParticipatedPromotionIds = new Set<string>(); // BigInt to String

    if (userId) {
      const userPromotions = await this.repository.findUserPromotions(userId);
      userPromotions.forEach((up) => {
        userParticipatedPromotionIds.add(up.promotionId.toString());
      });
    }

    // 번역과 통화 정보가 모두 있는 프로모션만 필터링 + 유저 참여 여부 필터링
    const filteredResults: ActivePromotionInfo[] = [];

    result.promotions.forEach((promotion) => {
      // 1. 이미 참여한 일회성 프로모션 제외
      if (
        userId &&
        promotion.isOneTime &&
        userParticipatedPromotionIds.has(promotion.id.toString())
      ) {
        return;
      }

      const translations = promotion.getTranslations();
      const currencies = promotion.getCurrencies();
      const currentTranslation = translations?.find(
        (t) => t.language === language,
      );
      // currency 파라미터가 있으면 해당 통화를 찾고, 없으면 첫 번째 통화 사용
      const currentCurrency = currency
        ? currencies?.find((c) => c.currency === currency)
        : currencies?.[0];

      if (currentTranslation && currentCurrency) {
        filteredResults.push({
          promotion,
          translation: currentTranslation,
          currencySetting: currentCurrency,
        });
      }
    });

    return {
      data: filteredResults,
      page,
      limit,
      total: filteredResults.length,
    };
  }
}
