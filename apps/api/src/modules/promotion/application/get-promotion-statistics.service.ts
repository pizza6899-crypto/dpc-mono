// src/modules/promotion/application/get-promotion-statistics.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { PROMOTION_REPOSITORY } from '../ports/out';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';

@Injectable()
export class GetPromotionStatisticsService {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
  ) {}

  async execute(promotionId: bigint) {
    return await this.repository.getPromotionStatistics(promotionId);
  }
}

