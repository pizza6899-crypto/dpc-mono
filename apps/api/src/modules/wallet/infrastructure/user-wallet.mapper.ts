// src/modules/wallet/infrastructure/user-wallet.mapper.ts
import { Injectable } from '@nestjs/common';
import { UserWallet } from '../domain';
import type { UserBalance as PrismaUserBalance, ExchangeCurrencyCode } from '@repo/database';
import { Prisma } from '@repo/database';

/**
 * UserWallet Mapper
 *
 * Prisma UserBalance 모델과 Domain UserWallet 엔티티 간 변환을 담당합니다.
 */
@Injectable()
export class UserWalletMapper {
  /**
   * Prisma 모델 → Domain 엔티티 변환
   */
  toDomain(prismaModel: PrismaUserBalance): UserWallet {
    return UserWallet.fromPersistence({
      userId: prismaModel.userId,
      currency: prismaModel.currency,
      mainBalance: prismaModel.mainBalance,
      bonusBalance: prismaModel.bonusBalance,
      updatedAt: prismaModel.updatedAt,
    });
  }

  /**
   * Domain 엔티티 → Prisma 모델 변환
   */
  toPrisma(domain: UserWallet): {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    mainBalance: Prisma.Decimal;
    bonusBalance: Prisma.Decimal;
    updatedAt: Date;
  } {
    const persistence = domain.toPersistence();
    return {
      userId: persistence.userId,
      currency: persistence.currency,
      mainBalance: persistence.mainBalance,
      bonusBalance: persistence.bonusBalance,
      updatedAt: persistence.updatedAt,
    };
  }
}

