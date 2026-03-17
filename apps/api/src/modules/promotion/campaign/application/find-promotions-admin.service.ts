// src/modules/promotion/campaign/application/find-promotions-admin.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { PromotionTargetType } from '@prisma/client';
import type { Promotion } from '../domain';
import { PROMOTION_REPOSITORY } from '../ports';
import type { PromotionRepositoryPort } from '../ports/promotion.repository.port';

interface FindPromotionsAdminParams {
  id?: bigint;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'id';
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  targetType?: PromotionTargetType;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class FindPromotionsAdminService {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
  ) { }

  async execute(params: FindPromotionsAdminParams = {}): Promise<{
    promotions: Array<{
      promotion: Promotion;
      statistics: {
        totalParticipants: number;
        statusCounts: Record<string, number>;
      };
    }>;
    total: number;
  }> {
    const { promotions, total } =
      await this.repository.findManyForAdmin(params);

    const promotionsWithStats = await Promise.all(
      promotions.map(async (promotion) => {
        const statistics = await this.repository.getPromotionStatistics(
          promotion.id,
        );
        return { promotion, statistics };
      }),
    );

    return {
      promotions: promotionsWithStats,
      total,
    };
  }
}
