// src/modules/promotion/application/find-promotion-participants.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { PROMOTION_REPOSITORY } from '../ports/out';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';

interface FindPromotionParticipantsParams {
  promotionId: bigint;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'id';
  sortOrder?: 'asc' | 'desc';
  status?: string;
  userId?: bigint;
}

@Injectable()
export class FindPromotionParticipantsService {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
  ) {}

  async execute(params: FindPromotionParticipantsParams) {
    return await this.repository.findUserPromotionsByPromotionId(params);
  }
}

