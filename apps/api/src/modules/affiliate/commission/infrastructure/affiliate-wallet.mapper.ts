// src/modules/affiliate/commission/infrastructure/affiliate-wallet.mapper.ts
import { Injectable } from '@nestjs/common';
import { ExchangeCurrencyCode, Prisma } from '@prisma/client';
import { AffiliateWallet } from '../domain';

/**
 * Domain 엔티티와 Prisma 모델 간 변환을 담당하는 Mapper
 * Infrastructure 레이어에 위치하여 Domain → Infrastructure 의존을 방지
 */
@Injectable()
export class AffiliateWalletMapper {
  /**
   * Prisma 모델 → Domain 엔티티 변환
   */
  toDomain(prismaModel: {
    affiliateId: string;
    currency: ExchangeCurrencyCode;
    availableBalance: Prisma.Decimal;
    pendingBalance: Prisma.Decimal;
    totalEarned: Prisma.Decimal;
    updatedAt: Date;
  }): AffiliateWallet {
    return AffiliateWallet.fromPersistence({
      affiliateId: prismaModel.affiliateId,
      currency: prismaModel.currency,
      availableBalance: prismaModel.availableBalance,
      pendingBalance: prismaModel.pendingBalance,
      totalEarned: prismaModel.totalEarned,
      updatedAt: prismaModel.updatedAt,
    });
  }

  /**
   * Domain 엔티티 → Prisma 모델 변환
   */
  toPrisma(domain: AffiliateWallet): {
    affiliateId: string;
    currency: ExchangeCurrencyCode;
    availableBalance: Prisma.Decimal;
    pendingBalance: Prisma.Decimal;
    totalEarned: Prisma.Decimal;
    updatedAt: Date;
  } {
    const persistence = domain.toPersistence();
    return {
      affiliateId: persistence.affiliateId,
      currency: persistence.currency,
      availableBalance: persistence.availableBalance,
      pendingBalance: persistence.pendingBalance,
      totalEarned: persistence.totalEarned,
      updatedAt: persistence.updatedAt,
    };
  }
}
