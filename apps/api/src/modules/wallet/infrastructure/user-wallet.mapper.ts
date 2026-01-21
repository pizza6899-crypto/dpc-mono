// src/modules/wallet/infrastructure/user-wallet.mapper.ts
import { Injectable } from '@nestjs/common';
import { UserWallet } from '../domain';
import type { UserWallet as PrismaUserWallet, ExchangeCurrencyCode } from '@prisma/client';
import { Prisma } from '@prisma/client';

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
  toDomain(prismaModel: PrismaUserWallet): UserWallet {
    return UserWallet.fromPersistence({
      userId: prismaModel.userId,
      currency: prismaModel.currency,
      cash: prismaModel.cash,
      bonus: prismaModel.bonus,
      reward: prismaModel.reward,
      lock: prismaModel.lock,
      vault: prismaModel.vault,
      updatedAt: prismaModel.updatedAt,
    });
  }

  /**
   * Domain 엔티티 → Prisma 모델 변환
   */
  toPrisma(domain: UserWallet): {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    cash: Prisma.Decimal;
    bonus: Prisma.Decimal;
    reward: Prisma.Decimal;
    lock: Prisma.Decimal;
    vault: Prisma.Decimal;
    updatedAt: Date;
  } {
    const persistence = domain.toPersistence();
    return {
      userId: persistence.userId,
      currency: persistence.currency,
      cash: persistence.cash,
      bonus: persistence.bonus,
      reward: persistence.reward,
      lock: persistence.lock,
      vault: persistence.vault,
      updatedAt: persistence.updatedAt,
    };
  }
}

