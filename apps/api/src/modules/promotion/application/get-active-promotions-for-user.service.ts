// src/modules/promotion/application/get-active-promotions-for-user.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Language, ExchangeCurrencyCode } from '@repo/database';
import type { Promotion } from '../domain';
import { PROMOTION_REPOSITORY } from '../ports/out';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';
import type { PromotionResponseDto } from '../controllers/user/dto/response/promotion.response.dto';
import type { PaginatedData } from 'src/common/http/types/pagination.types';

interface GetActivePromotionsForUserParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'id';
  sortOrder?: 'asc' | 'desc';
  language?: Language;
  currency?: ExchangeCurrencyCode;
}

@Injectable()
export class GetActivePromotionsForUserService {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
  ) {}

  async execute(
    params: GetActivePromotionsForUserParams,
  ): Promise<PaginatedData<PromotionResponseDto>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      language = Language.EN,
      currency = ExchangeCurrencyCode.USD,
    } = params;

    const result = await this.repository.findActivePromotionsPaginated({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // 번역과 통화 정보가 모두 있는 프로모션만 필터링
    const filteredPromotions = result.promotions.filter((promotion) => {
      const translations = promotion.getTranslations();
      const currencies = promotion.getCurrencies();
      const currentTranslation = translations?.find(
        (t) => t.language === language,
      );
      // currency 파라미터가 있으면 해당 통화를 찾고, 없으면 첫 번째 통화 사용
      const currentCurrency = currency
        ? currencies?.find((c) => c.currency === currency)
        : currencies?.[0];

      return currentTranslation !== undefined && currentCurrency !== undefined;
    });

    // DTO로 변환
    const data: PromotionResponseDto[] = filteredPromotions.map(
      (promotion) => {
        const translations = promotion.getTranslations();
        const currencies = promotion.getCurrencies();
        const currentTranslation = translations?.find(
          (t) => t.language === language,
        )!; // 필터링 후이므로 존재함
        // currency 파라미터가 있으면 해당 통화를 찾고, 없으면 첫 번째 통화 사용
        const currentCurrency = currency
          ? currencies?.find((c) => c.currency === currency)!
          : currencies?.[0]!; // 필터링 후이므로 존재함

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
      },
    );

    return {
      data,
      page,
      limit,
      total: filteredPromotions.length,
    };
  }
}

