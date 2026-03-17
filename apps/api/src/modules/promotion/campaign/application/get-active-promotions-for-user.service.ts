// src/modules/promotion/campaign/application/get-active-promotions-for-user.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Language, ExchangeCurrencyCode } from '@prisma/client';
import {
  Promotion,
  PromotionTranslation,
  PromotionLanguageRequiredException,
  PromotionCurrencyRequiredException,
} from '../domain';
import { PromotionCurrencyRule } from '../domain/model/promotion-currency-rule.entity';
import { PROMOTION_REPOSITORY } from '../ports';
import type { PromotionRepositoryPort } from '../ports/promotion.repository.port';
import type { PaginatedData } from 'src/common/http/types/pagination.types';

interface GetActivePromotionsForUserParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'id';
  sortOrder?: 'asc' | 'desc';
  language: Language;
  currency: ExchangeCurrencyCode;
}

export interface ActivePromotionInfo {
  promotion: Promotion;
  translation: PromotionTranslation;
  currencySetting: PromotionCurrencyRule;
}

@Injectable()
export class GetActivePromotionsForUserService {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
  ) { }

  async execute(
    params: GetActivePromotionsForUserParams & { userId?: bigint },
  ): Promise<PaginatedData<ActivePromotionInfo>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      language,
      currency,
      userId,
    } = params;

    if (!language) {
      throw new PromotionLanguageRequiredException();
    }

    if (!currency) {
      throw new PromotionCurrencyRequiredException();
    }

    const result = await this.repository.findActivePromotionsPaginated({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    const userParticipatedPromotionIds = new Set<string>();

    if (userId) {
      const userPromotions = await this.repository.findUserPromotions(userId);
      userPromotions.forEach((up) => {
        userParticipatedPromotionIds.add(up.promotionId.toString());
      });
    }

    const filteredResults: ActivePromotionInfo[] = [];

    result.promotions.forEach((promotion) => {
      // 1. 활성 상태 및 기간/요일/시간 체크
      if (!promotion.isCurrentlyActive()) {
        return;
      }

      // 2. 이미 참여한 프로모션 필터링 (TargetType 로직에 따라 다르겠지만 여기서는 참여 기록이 있으면 제외하는 예시)
      if (userId && userParticipatedPromotionIds.has(promotion.id.toString())) {
        return;
      }

      const translations = promotion.getTranslations();
      const currencyRules = promotion.getCurrencyRules();
      const currentTranslation = translations?.find((t) => t.language === language);
      const currentCurrencyRule = currencyRules?.find((c) => c.currency === currency) || currencyRules?.[0];

      if (currentTranslation && currentCurrencyRule) {
        filteredResults.push({
          promotion,
          translation: currentTranslation,
          currencySetting: currentCurrencyRule,
        });
      }
    });

    return {
      data: filteredResults,
      page,
      limit,
      total: result.total, // 전체 개수는 원본 결과 기준
    };
  }
}
