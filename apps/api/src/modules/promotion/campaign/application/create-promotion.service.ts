// src/modules/promotion/campaign/application/create-promotion.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { PromotionTargetType, PromotionResetType } from '@prisma/client';
import { Transactional } from '@nestjs-cls/transactional';
import {
  Promotion,
  PromotionPolicy,
} from '../domain';
import { PROMOTION_REPOSITORY } from '../ports';
import type { PromotionRepositoryPort } from '../ports/promotion.repository.port';

interface CreatePromotionParams {
  isActive?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  targetType: PromotionTargetType;
  maxUsagePerUser?: number | null;
  periodicResetType?: PromotionResetType;
  applicableDays?: number[];
  applicableStartTime?: Date | null;
  applicableEndTime?: Date | null;
  bonusExpiryMinutes?: number | null;
}

@Injectable()
export class CreatePromotionService {
  private readonly logger = new Logger(CreatePromotionService.name);

  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
    private readonly policy: PromotionPolicy,
  ) { }

  @Transactional()
  async execute(params: CreatePromotionParams): Promise<Promotion> {
    // 설정 유효성 검사 (입금 필수 프로모션만 다루므로 정책 단순화)
    this.policy.validateConfiguration({});

    const promotion = await this.repository.create({
      isActive: params.isActive ?? true,
      startDate: params.startDate ?? null,
      endDate: params.endDate ?? null,
      targetType: params.targetType,
      maxUsagePerUser: params.maxUsagePerUser ?? null,
      periodicResetType: params.periodicResetType ?? 'NONE',
      applicableDays: params.applicableDays ?? [],
      applicableStartTime: params.applicableStartTime ?? null,
      applicableEndTime: params.applicableEndTime ?? null,
      bonusExpiryMinutes: params.bonusExpiryMinutes ?? null,
    });

    this.logger.log(
      `Promotion created: id=${promotion.id}`,
    );

    return promotion;
  }
}
