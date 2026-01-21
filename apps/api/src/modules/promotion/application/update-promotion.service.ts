// src/modules/promotion/application/update-promotion.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Prisma, PromotionBonusType, PromotionTargetType } from '@prisma/client';
import {
  Promotion,
  PromotionPolicy,
  PromotionNotFoundException,
  PromotionCodeAlreadyExistsException,
} from '../domain';
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
  code?: string;
  bonusType?: PromotionBonusType;
  targetType?: PromotionTargetType;
  isDepositRequired?: boolean;
  maxUsageCount?: number | null;
  bonusExpiryMinutes?: number | null;
}

@Injectable()
export class UpdatePromotionService {
  private readonly logger = new Logger(UpdatePromotionService.name);

  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
    private readonly policy: PromotionPolicy,
  ) { }

  @Transactional()
  async execute(params: UpdatePromotionParams): Promise<Promotion> {
    const promotion = await this.repository.findById(params.id);
    if (!promotion) {
      throw new PromotionNotFoundException(params.id);
    }

    // 업데이트할 필드만 변경
    if (params.isActive !== undefined) {
      promotion.setActive(params.isActive);
    }

    if (
      params.code !== undefined &&
      params.code !== promotion.code
    ) {
      const existing = await this.repository.findByCode(params.code);
      if (existing && existing.id !== promotion.id) {
        throw new PromotionCodeAlreadyExistsException(params.code);
      }
    }

    // 설정 유효성 검사 (기존 값과 파라미터 병합)
    this.policy.validateConfiguration({
      isDepositRequired: params.isDepositRequired ?? promotion.isDepositRequired,
      bonusType: (params.bonusType ?? promotion.bonusType) as any,
      bonusRate:
        params.bonusRate !== undefined ? params.bonusRate : promotion.bonusRate,
    });

    const updated = await this.repository.update({
      id: promotion.id,
      ...(params.managementName !== undefined && {
        managementName: params.managementName,
      }),
      ...(params.isActive !== undefined && { isActive: params.isActive }),
      ...(params.startDate !== undefined && { startDate: params.startDate }),
      ...(params.endDate !== undefined && { endDate: params.endDate }),
      ...(params.bonusRate !== undefined && { bonusRate: params.bonusRate }),
      ...(params.rollingMultiplier !== undefined && {
        rollingMultiplier: params.rollingMultiplier,
      }),
      ...(params.isOneTime !== undefined && { isOneTime: params.isOneTime }),
      ...(params.code !== undefined && { code: params.code }),
      ...(params.bonusType !== undefined && { bonusType: params.bonusType }),
      ...(params.targetType !== undefined && { targetType: params.targetType }),
      ...(params.isDepositRequired !== undefined && {
        isDepositRequired: params.isDepositRequired,
      }),
      ...(params.maxUsageCount !== undefined && {
        maxUsageCount: params.maxUsageCount,
      }),
      ...(params.bonusExpiryMinutes !== undefined && {
        bonusExpiryMinutes: params.bonusExpiryMinutes,
      }),
    });

    this.logger.log(`Promotion updated: id=${params.id}`);

    return updated;
  }
}

