// src/modules/wallet/infrastructure/user-wallet.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/common/prisma/prisma.module';
import type { UserWalletRepositoryPort } from '../ports/out/user-wallet.repository.port';
import { UserWallet } from '../domain';
import { UserWalletMapper } from './user-wallet.mapper';
import type { ExchangeCurrencyCode } from '@repo/database';

/**
 * UserWallet Repository Implementation
 *
 * Prisma를 사용한 UserWalletRepositoryPort 구현체입니다.
 */
@Injectable()
export class UserWalletRepository implements UserWalletRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: UserWalletMapper,
  ) {}

  async findByUserIdAndCurrency(
    userId: bigint,
    currency: ExchangeCurrencyCode,
  ): Promise<UserWallet | null> {
    const balance = await this.tx.userBalance.findUnique({
      where: {
        userId_currency: {
          userId,
          currency,
        },
      },
    });

    return balance ? this.mapper.toDomain(balance) : null;
  }

  async findByUserId(userId: bigint): Promise<UserWallet[]> {
    const balances = await this.tx.userBalance.findMany({
      where: {
        userId,
      },
    });

    return balances.map((balance) => this.mapper.toDomain(balance));
  }

  async upsert(wallet: UserWallet): Promise<UserWallet> {
    const data = this.mapper.toPrisma(wallet);
    const result = await this.tx.userBalance.upsert({
      where: {
        userId_currency: {
          userId: data.userId,
          currency: data.currency,
        },
      },
      create: {
        userId: data.userId,
        currency: data.currency,
        mainBalance: data.mainBalance,
        bonusBalance: data.bonusBalance,
        updatedAt: data.updatedAt,
      },
      update: {
        mainBalance: data.mainBalance,
        bonusBalance: data.bonusBalance,
        updatedAt: data.updatedAt,
      },
    });

    return this.mapper.toDomain(result);
  }
}

