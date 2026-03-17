// src/modules/promotion/campaign/application/update-promotion.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { PromotionTargetType, PromotionResetType } from '@prisma/client';
import { Transactional } from '@nestjs-cls/transactional';
import { Promotion } from '../domain';
import { PROMOTION_REPOSITORY } from '../ports';
import type { PromotionRepositoryPort } from '../ports/promotion.repository.port';

interface UpdatePromotionParams {
  id: bigint;
  isActive?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  targetType?: PromotionTargetType;
  maxUsageCount?: number | null;
  maxUsagePerUser?: number | null;
  periodicResetType?: PromotionResetType;
  applicableDays?: number[];
  applicableStartTime?: Date | null;
  applicableEndTime?: Date | null;
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
      maxUsageCount: params.maxUsageCount,
      maxUsagePerUser: params.maxUsagePerUser,
      periodicResetType: params.periodicResetType,
      applicableDays: params.applicableDays,
      applicableStartTime: params.applicableStartTime,
      applicableEndTime: params.applicableEndTime,
      bonusExpiryMinutes: params.bonusExpiryMinutes,
    });

    this.logger.log(`Promotion updated: id=${promotion.id}`);

    return promotion;
  }
}
