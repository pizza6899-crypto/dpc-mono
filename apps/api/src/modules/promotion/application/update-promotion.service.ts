// src/modules/promotion/application/update-promotion.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Promotion } from '../domain';
import { PROMOTION_REPOSITORY } from '../ports';
import type { PromotionRepositoryPort } from '../ports/promotion.repository.port';

interface UpdatePromotionParams {
  id: bigint;
  isActive?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  targetType?: any;
  bonusType?: any;
  maxUsageCount?: number | null;
  bonusExpiryMinutes?: number | null;
}

@Injectable()
export class UpdatePromotionService {
  private readonly logger = new Logger(UpdatePromotionService.name);

  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
  ) { }

  @Transactional()
  async execute(params: UpdatePromotionParams): Promise<Promotion> {
    const promotion = await this.repository.update(params.id, {
      isActive: params.isActive,
      startDate: params.startDate,
      endDate: params.endDate,
      targetType: params.targetType,
      bonusType: params.bonusType,
      maxUsageCount: params.maxUsageCount,
      bonusExpiryMinutes: params.bonusExpiryMinutes,
    });

    this.logger.log(`Promotion updated: id=${promotion.id}`);

    return promotion;
  }
}
