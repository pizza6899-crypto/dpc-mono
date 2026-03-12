// src/modules/promotion/application/get-promotion-admin.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Promotion, PromotionNotFoundException } from '../domain';
import { PROMOTION_REPOSITORY } from '../ports';
import type { PromotionRepositoryPort } from '../ports/promotion.repository.port';

@Injectable()
export class GetPromotionAdminService {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
  ) { }

  async execute(id: bigint): Promise<{
    promotion: Promotion;
    statistics: {
      totalParticipants: number;
      statusCounts: Record<string, number>;
    };
  }> {
    const promotion = await this.repository.findById(id);
    if (!promotion) {
      throw new PromotionNotFoundException();
    }

    // 통계 정보 조회
    const statistics = await this.repository.getPromotionStatistics(id);

    return { promotion, statistics };
  }
}
