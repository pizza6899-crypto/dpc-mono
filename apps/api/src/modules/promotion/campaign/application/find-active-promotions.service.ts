// src/modules/promotion/campaign/application/find-active-promotions.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { PromotionTargetType } from '@prisma/client';
import type { Promotion } from '../domain';
import { PROMOTION_REPOSITORY } from '../ports';
import type { PromotionRepositoryPort } from '../ports/promotion.repository.port';

interface FindActivePromotionsParams {
  targetType?: PromotionTargetType;
  now?: Date;
}

@Injectable()
export class FindActivePromotionsService {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
  ) { }

  async execute({
    targetType,
    now = new Date(),
  }: FindActivePromotionsParams = {}): Promise<Promotion[]> {
    if (targetType) {
      return await this.repository.findByTargetType(targetType, now);
    }
    return await this.repository.findActivePromotions(now);
  }
}
