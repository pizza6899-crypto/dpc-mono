// src/modules/promotion/application/create-promotion.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
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
  targetType: any;
  bonusType: any;
  maxUsageCount?: number | null;
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
    this.policy.validateConfiguration({
      bonusType: params.bonusType,
    });

    const promotion = await this.repository.create({
      isActive: params.isActive ?? true,
      startDate: params.startDate ?? null,
      endDate: params.endDate ?? null,
      targetType: params.targetType,
      bonusType: params.bonusType,
      maxUsageCount: params.maxUsageCount ?? null,
      bonusExpiryMinutes: params.bonusExpiryMinutes ?? null,
    });

    this.logger.log(
      `Promotion created: id=${promotion.id}`,
    );

    return promotion;
  }
}
