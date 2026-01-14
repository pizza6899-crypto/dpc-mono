// src/modules/promotion/application/update-promotion.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Prisma } from '@repo/database';
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
      bonusType: promotion.bonusType, // bonusType은 현재 수정을 받지 않음 (필요시 추가)
      bonusRate: params.bonusRate !== undefined ? params.bonusRate : promotion.bonusRate,
      // currencies는 현재 별도 API로 관리되므로 여기서는 체크 생략하거나
      // 전체 생명주기 관리 방식에 따라 보강 필요
    });

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
      ...(params.code !== undefined && { code: params.code }),
      ...(params.isDepositRequired !== undefined && { isDepositRequired: params.isDepositRequired }),
      ...(params.maxUsageCount !== undefined && { maxUsageCount: params.maxUsageCount }),
      ...(params.bonusExpiryMinutes !== undefined && { bonusExpiryMinutes: params.bonusExpiryMinutes }),
    });

    this.logger.log(`Promotion updated: id=${params.id}`);

    return updated;
  }
}

