// src/modules/affiliate/commission/infrastructure/affiliate-tier.mapper.ts
import { Injectable } from '@nestjs/common';
import { AffiliateTierLevel, Prisma } from '@repo/database';
import { AffiliateTier } from '../domain';

/**
 * Domain 엔티티와 Prisma 모델 간 변환을 담당하는 Mapper
 * Infrastructure 레이어에 위치하여 Domain → Infrastructure 의존을 방지
 */
@Injectable()
export class AffiliateTierMapper {
  /**
   * Prisma 모델 → Domain 엔티티 변환
   */
  toDomain(prismaModel: {
    id: bigint;
    uid: string;
    affiliateId: bigint;
    tier: AffiliateTierLevel;
    baseRate: Prisma.Decimal;
    customRate: Prisma.Decimal | null;
    isCustomRate: boolean;
    monthlyWagerAmount: Prisma.Decimal;
    customRateSetBy: bigint | null;
    customRateSetAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): AffiliateTier {
    return AffiliateTier.fromPersistence({
      id: prismaModel.id,
      uid: prismaModel.uid,
      affiliateId: prismaModel.affiliateId,
      tier: prismaModel.tier,
      baseRate: prismaModel.baseRate,
      customRate: prismaModel.customRate,
      isCustomRate: prismaModel.isCustomRate,
      monthlyWagerAmount: prismaModel.monthlyWagerAmount,
      customRateSetBy: prismaModel.customRateSetBy,
      customRateSetAt: prismaModel.customRateSetAt,
      createdAt: prismaModel.createdAt,
      updatedAt: prismaModel.updatedAt,
    });
  }

  /**
   * Domain 엔티티 → Prisma 모델 변환
   */
  toPrisma(domain: AffiliateTier): {
    id: bigint | null;
    uid: string;
    affiliateId: bigint;
    tier: AffiliateTierLevel;
    baseRate: Prisma.Decimal;
    customRate: Prisma.Decimal | null;
    isCustomRate: boolean;
    monthlyWagerAmount: Prisma.Decimal;
    customRateSetBy: bigint | null;
    customRateSetAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  } {
    const persistence = domain.toPersistence();
    return {
      id: persistence.id,
      uid: persistence.uid,
      affiliateId: persistence.affiliateId,
      tier: persistence.tier,
      baseRate: persistence.baseRate,
      customRate: persistence.customRate,
      isCustomRate: persistence.isCustomRate,
      monthlyWagerAmount: persistence.monthlyWagerAmount,
      customRateSetBy: persistence.customRateSetBy,
      customRateSetAt: persistence.customRateSetAt,
      createdAt: persistence.createdAt,
      updatedAt: persistence.updatedAt,
    };
  }
}
