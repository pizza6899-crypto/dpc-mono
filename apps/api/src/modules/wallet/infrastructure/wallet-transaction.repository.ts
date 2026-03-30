// src/modules/wallet/infrastructure/wallet-transaction.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { UserWalletTransactionRepositoryPort } from '../ports/out/user-wallet-transaction.repository.port';
import { UserWalletTransaction } from '../domain';
import { UserWalletTransactionSearchOptions } from '../ports/out/user-wallet-transaction.search-options';
import { Prisma } from '@prisma/client';
import { UserWalletTransactionMapper } from './user-wallet-transaction.mapper';
import { SnowflakeService } from 'src/infrastructure/snowflake/snowflake.service';

@Injectable()
export class UserWalletTransactionRepository implements UserWalletTransactionRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: UserWalletTransactionMapper,
  ) {}

  async create(
    transaction: UserWalletTransaction,
  ): Promise<UserWalletTransaction> {
    const data = this.mapper.toPrisma(transaction);

    const result = await this.tx.userWalletTransaction.create({
      data: {
        ...data,
        id: transaction.id,
      },
    });

    return this.mapper.toDomain(result);
  }

  async listByUserId(
    options: UserWalletTransactionSearchOptions,
  ): Promise<[UserWalletTransaction[], number]> {
    const {
      userId,
      currency,
      type,
      balanceTypes,
      excludeBalanceTypes,
      startDate,
      endDate,
      referenceId,
      page,
      limit,
    } = options;

    const where: Prisma.UserWalletTransactionWhereInput = {
      userId,
      currency,
      type,
      referenceId,
      balanceType: {
        in: balanceTypes,
        notIn: excludeBalanceTypes,
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    const [items, total] = await Promise.all([
      this.tx.userWalletTransaction.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.tx.userWalletTransaction.count({
        where,
      }),
    ]);

    const transactions = items.map((item) => this.mapper.toDomain(item));

    return [transactions, total];
  }
}
