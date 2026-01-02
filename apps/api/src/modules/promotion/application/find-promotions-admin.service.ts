// src/modules/promotion/application/find-promotions-admin.service.ts
import { Inject, Injectable } from '@nestjs/common';
import type { Promotion } from '../domain';
import { PROMOTION_REPOSITORY } from '../ports/out';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';

interface FindPromotionsAdminParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'id';
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  targetType?: string;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class FindPromotionsAdminService {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
  ) {}

  async execute(
    params: FindPromotionsAdminParams = {},
  ): Promise<{
    promotions: Promotion[];
    total: number;
  }> {
    return await this.repository.findManyForAdmin(params);
  }
}

