// src/modules/wallet/infrastructure/user-wallet.mapper.ts
import { Injectable } from '@nestjs/common';
import { UserWallet } from '../domain';
import type { UserWallet as PrismaUserWallet, ExchangeCurrencyCode, WalletStatus } from '@prisma/client';
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

      lock: prismaModel.lock,
      vault: prismaModel.vault,
      status: prismaModel.status,
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

    lock: Prisma.Decimal;
    vault: Prisma.Decimal;
    status: WalletStatus;
    updatedAt: Date;
  } {
    return {
      userId: domain.userId,
      currency: domain.currency,
      cash: domain.cash,
      bonus: domain.bonus,

      lock: domain.lock,
      vault: domain.vault,
      status: domain.status,
      updatedAt: domain.updatedAt,
    };
  }
}

