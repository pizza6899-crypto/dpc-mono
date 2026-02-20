// src/modules/promotion/application/find-user-promotions.service.ts
import { Inject, Injectable } from '@nestjs/common';
import type { UserPromotion } from '../domain';
import { PROMOTION_REPOSITORY } from '../ports/out';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';

@Injectable()
export class FindUserPromotionsService {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
  ) {}

  async execute(userId: bigint, status?: string): Promise<UserPromotion[]> {
    return await this.repository.findUserPromotions(userId, status);
  }
}
