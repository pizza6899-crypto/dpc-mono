// src/modules/affiliate/commission/infrastructure/affiliate-commission.mapper.ts
import { Injectable } from '@nestjs/common';
import {
  CommissionStatus,
  ExchangeCurrencyCode,
  GameCategory,
  Prisma,
} from '@repo/database';
import { AffiliateCommission } from '../domain';

/**
 * Domain 엔티티와 Prisma 모델 간 변환을 담당하는 Mapper
 * Infrastructure 레이어에 위치하여 Domain → Infrastructure 의존을 방지
 */
@Injectable()
export class AffiliateCommissionMapper {
  /**
   * Prisma 모델 → Domain 엔티티 변환
   */
  toDomain(prismaModel: {
    id: bigint;
    affiliateId: bigint;
    subUserId: bigint;
    gameRoundId: bigint | null;
    wagerAmount: Prisma.Decimal;
    winAmount: Prisma.Decimal | null;
    commission: Prisma.Decimal;
    rateApplied: Prisma.Decimal;
    currency: ExchangeCurrencyCode;
    status: CommissionStatus;
    gameCategory: GameCategory | null;
    settlementDate: Date | null;
    claimedAt: Date | null;
    withdrawnAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): AffiliateCommission {
    return AffiliateCommission.fromPersistence({
      id: prismaModel.id,
      affiliateId: prismaModel.affiliateId,
      subUserId: prismaModel.subUserId,
      gameRoundId: prismaModel.gameRoundId,
      wagerAmount: prismaModel.wagerAmount,
      winAmount: prismaModel.winAmount,
      commission: prismaModel.commission,
      rateApplied: prismaModel.rateApplied,
      currency: prismaModel.currency,
      status: prismaModel.status,
      gameCategory: prismaModel.gameCategory,
      settlementDate: prismaModel.settlementDate,
      claimedAt: prismaModel.claimedAt,
      withdrawnAt: prismaModel.withdrawnAt,
      createdAt: prismaModel.createdAt,
      updatedAt: prismaModel.updatedAt,
    });
  }

  /**
   * Domain 엔티티 → Prisma 모델 변환
   */
  toPrisma(domain: AffiliateCommission): {
    id: bigint | null;
    affiliateId: bigint;
    subUserId: bigint;
    gameRoundId: bigint | null;
    wagerAmount: Prisma.Decimal;
    winAmount: Prisma.Decimal | null;
    commission: Prisma.Decimal;
    rateApplied: Prisma.Decimal;
    currency: ExchangeCurrencyCode;
    status: CommissionStatus;
    gameCategory: GameCategory | null;
    settlementDate: Date | null;
    claimedAt: Date | null;
    withdrawnAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  } {
    const persistence = domain.toPersistence();
    return {
      id: persistence.id,
      affiliateId: persistence.affiliateId,
      subUserId: persistence.subUserId,
      gameRoundId: persistence.gameRoundId,
      wagerAmount: persistence.wagerAmount,
      winAmount: persistence.winAmount,
      commission: persistence.commission,
      rateApplied: persistence.rateApplied,
      currency: persistence.currency,
      status: persistence.status,
      gameCategory: persistence.gameCategory,
      settlementDate: persistence.settlementDate,
      claimedAt: persistence.claimedAt,
      withdrawnAt: persistence.withdrawnAt,
      createdAt: persistence.createdAt,
      updatedAt: persistence.updatedAt,
    };
  }
}
