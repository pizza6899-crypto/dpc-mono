// src/modules/promotion/application/update-promotion.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Prisma } from '@repo/database';
import { Promotion, PromotionNotFoundException } from '../domain';
import { PROMOTION_REPOSITORY } from '../ports/out';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';

interface UpdatePromotionParams {
  id: bigint;
  managementName?: string;
  isActive?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  bonusRate?: Prisma.Decimal | null;
  rollingMultiplier?: Prisma.Decimal | null;
  isOneTime?: boolean;
}

@Injectable()
export class UpdatePromotionService {
  private readonly logger = new Logger(UpdatePromotionService.name);

  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
  ) {}

  @Transactional()
  async execute(params: UpdatePromotionParams): Promise<Promotion> {
    const promotion = await this.repository.findById(params.id);
    if (!promotion) {
      throw new PromotionNotFoundException(params.id);
    }

    // 업데이트할 필드만 변경
    if (params.isActive !== undefined) {
      if (params.isActive !== promotion.isActive) {
        promotion.toggleActive();
      }
    }

    const updated = await this.repository.update({
      id: promotion.id,
      ...(params.managementName !== undefined && {
        managementName: params.managementName,
      }),
      ...(params.isActive !== undefined && { isActive: promotion.isActive }),
      ...(params.startDate !== undefined && { startDate: params.startDate }),
      ...(params.endDate !== undefined && { endDate: params.endDate }),
      ...(params.bonusRate !== undefined && { bonusRate: params.bonusRate }),
      ...(params.rollingMultiplier !== undefined && {
        rollingMultiplier: params.rollingMultiplier,
      }),
      ...(params.isOneTime !== undefined && { isOneTime: params.isOneTime }),
    });

    this.logger.log(`Promotion updated: id=${params.id}`);

    return updated;
  }
}

