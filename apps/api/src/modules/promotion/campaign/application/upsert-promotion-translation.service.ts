// src/modules/promotion/campaign/application/upsert-promotion-translation.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Language } from '@prisma/client';
import { PROMOTION_REPOSITORY } from '../ports';
import type { PromotionRepositoryPort } from '../ports/promotion.repository.port';
import { PromotionNotFoundException } from '../domain';

interface UpsertPromotionTranslationParams {
  promotionId: bigint;
  language: Language;
  title: string;
  description?: string | null;
}

@Injectable()
export class UpsertPromotionTranslationService {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
  ) { }

  async execute(params: UpsertPromotionTranslationParams): Promise<void> {
    const promotion = await this.repository.findById(params.promotionId);
    if (!promotion) {
      throw new PromotionNotFoundException();
    }

    await this.repository.upsertTranslation({
      promotionId: params.promotionId,
      language: params.language,
      title: params.title,
      description: params.description || null,
    });
  }
}
