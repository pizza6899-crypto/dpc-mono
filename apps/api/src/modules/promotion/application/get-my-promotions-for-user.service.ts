// src/modules/promotion/application/get-my-promotions-for-user.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { UserPromotion } from '../domain';
import { PROMOTION_REPOSITORY } from '../ports/out';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';

interface GetMyPromotionsForUserParams {
  userId: bigint;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'id';
  sortOrder?: 'asc' | 'desc';
  status?: string;
}

@Injectable()
export class GetMyPromotionsForUserService {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
  ) {}

  async execute(params: GetMyPromotionsForUserParams): Promise<{
    userPromotions: UserPromotion[];
    total: number;
  }> {
    return await this.repository.findUserPromotionsPaginated(params);
  }
}
