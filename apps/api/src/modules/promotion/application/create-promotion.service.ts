// src/modules/promotion/application/create-promotion.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Prisma, ExchangeCurrencyCode, Language } from '@repo/database';
import { Promotion } from '../domain';
import { PROMOTION_REPOSITORY } from '../ports/out';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';

interface CurrencySetting {
  currency: ExchangeCurrencyCode;
  minDepositAmount: Prisma.Decimal;
  maxBonusAmount?: Prisma.Decimal | null;
}

interface Translation {
  language: Language;
  name: string;
  description?: string | null;
}

interface CreatePromotionParams {
  managementName: string;
  isActive?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  targetType: string;
  bonusType: string;
  bonusRate?: Prisma.Decimal | null;
  rollingMultiplier?: Prisma.Decimal | null;
  qualificationMaintainCondition: string;
  isOneTime?: boolean;
  currencies?: CurrencySetting[];
  translations?: Translation[];
}

@Injectable()
export class CreatePromotionService {
  private readonly logger = new Logger(CreatePromotionService.name);

  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
  ) {}

  @Transactional()
  async execute(params: CreatePromotionParams): Promise<Promotion> {
    const promotion = await this.repository.create({
      managementName: params.managementName,
      isActive: params.isActive ?? true,
      startDate: params.startDate ?? null,
      endDate: params.endDate ?? null,
      targetType: params.targetType as any,
      bonusType: params.bonusType as any,
      bonusRate: params.bonusRate ?? null,
      rollingMultiplier: params.rollingMultiplier ?? null,
      qualificationMaintainCondition: params.qualificationMaintainCondition as any,
      isOneTime: params.isOneTime ?? false,
    });

    const promotionId = promotion.id;

    // 통화별 설정 생성
    if (params.currencies && params.currencies.length > 0) {
      await Promise.all(
        params.currencies.map((currency) =>
          this.repository.upsertCurrencySettings({
            promotionId,
            currency: currency.currency,
            minDepositAmount: currency.minDepositAmount,
            maxBonusAmount: currency.maxBonusAmount,
          }),
        ),
      );
      this.logger.log(
        `Currency settings created: promotionId=${promotionId}, count=${params.currencies.length}`,
      );
    }

    // 번역 정보 생성
    if (params.translations && params.translations.length > 0) {
      await this.repository.createTranslations(promotionId, params.translations);
      this.logger.log(
        `Translations created: promotionId=${promotionId}, count=${params.translations.length}`,
      );
    }

    this.logger.log(`Promotion created: id=${promotion.id}, name=${params.managementName}`);

    return promotion;
  }
}

