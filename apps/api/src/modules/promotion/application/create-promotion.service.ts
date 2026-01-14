// src/modules/promotion/application/create-promotion.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Prisma } from '@repo/database';
import {
  Promotion,
  PromotionPolicy,
  PromotionCodeAlreadyExistsException,
} from '../domain';
import { PROMOTION_REPOSITORY } from '../ports/out';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';

interface CreatePromotionParams {
  managementName: string;
  isActive?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  targetType: string;
  bonusType: string;
  bonusRate?: Prisma.Decimal | null;
  rollingMultiplier?: Prisma.Decimal | null;
  qualificationMaintainCondition: string;
  isOneTime?: boolean;
  isDepositRequired?: boolean;
  maxUsageCount?: number | null;
  bonusExpiryMinutes?: number | null;
  code: string;
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
    const existing = await this.repository.findByCode(params.code);
    if (existing) {
      throw new PromotionCodeAlreadyExistsException(params.code);
    }

    // 설정 유효성 검사 (통화별 설정은 별도 API로 처리하므로 currencies 제외)
    this.policy.validateConfiguration({
      isDepositRequired: params.isDepositRequired ?? true,
      bonusType: params.bonusType as any,
      bonusRate: params.bonusRate,
    });

    const promotion = await this.repository.create({
      managementName: params.managementName,
      isActive: params.isActive ?? true,
      startDate: params.startDate ?? null,
      endDate: params.endDate ?? null,
      targetType: params.targetType as any,
      bonusType: params.bonusType as any,
      bonusRate: params.bonusRate ?? null,
      rollingMultiplier: params.rollingMultiplier ?? null,
      qualificationMaintainCondition: params.qualificationMaintainCondition as any,
      isOneTime: params.isOneTime ?? false,
      isDepositRequired: params.isDepositRequired ?? true,
      maxUsageCount: params.maxUsageCount ?? null,
      bonusExpiryMinutes: params.bonusExpiryMinutes ?? null,
      note: [],
      code: params.code,
    });

    this.logger.log(`Promotion created: id=${promotion.id}, name=${params.managementName}`);

    return promotion;
  }
}

