// src/modules/wallet/infrastructure/user-wallet.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import type { UserWalletRepositoryPort } from '../ports/out/user-wallet.repository.port';
import { UserWallet, WalletNotFoundException } from '../domain';
import { UserWalletMapper } from './user-wallet.mapper';
import type { ExchangeCurrencyCode } from '@prisma/client';
import { LockNamespace } from 'src/common/concurrency/lock-namespace';
import { DomainException } from 'src/common/exception/domain.exception';
import { MessageCode } from '@repo/shared';
import { HttpStatus } from '@nestjs/common';
import { UserWalletSearchOptions } from '../ports/out/user-wallet.search-options';

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
  ) { }

  async findByUserIdAndCurrency(
    userId: bigint,
    currency: ExchangeCurrencyCode,
  ): Promise<UserWallet | null> {
    const balance = await this.tx.userWallet.findUnique({
      where: {
        userId_currency: {
          userId,
          currency,
        },
      },
    });

    return balance ? this.mapper.toDomain(balance) : null;
  }

  async getStatistics(): Promise<any> {
    const stats = await this.tx.userWallet.groupBy({
      by: ['currency'],
      _sum: {
        cash: true,
        bonus: true,
        reward: true,
        lock: true,
        vault: true,
      },
      _count: {
        userId: true,
      },
    });

    return stats.map((s) => ({
      currency: s.currency,
      totalCash: s._sum.cash || 0,
      totalBonus: s._sum.bonus || 0,
      totalReward: s._sum.reward || 0,
      totalLock: s._sum.lock || 0,
      totalVault: s._sum.vault || 0,
      userCount: s._count.userId,
    }));
  }

  async getByUserIdAndCurrency(
    userId: bigint,
    currency: ExchangeCurrencyCode,
  ): Promise<UserWallet> {
    const wallet = await this.findByUserIdAndCurrency(userId, currency);
    if (!wallet) {
      throw new WalletNotFoundException(userId, currency);
    }
    return wallet;
  }

  /**
   * PostgreSQL Advisory Lock을 사용하여 사용자 지갑에 대한 배타적 락을 획득합니다.
   * 트랜잭션이 종료되면 자동으로 해제됩니다 (Transaction-level advisory lock).
   */
  async acquireLock(userId: bigint): Promise<void> {
    try {
      // 락 타임아웃 3초 설정
      await this.tx.$executeRaw`SET LOCAL lock_timeout = '3s'`;

      // USER_WALLET 네임스페이스와 userId를 조합하여 64비트 유니크 키 생성 및 락 획득
      // MD5 해시의 앞 16자리를 사용하여 충돌 가능성을 최소화한 64비트 정수로 변환
      await this.tx.$executeRaw`SELECT pg_advisory_xact_lock(('x' || substr(md5(${LockNamespace.USER_WALLET}::text || ${userId.toString()}), 1, 16))::bit(64)::bigint)`;
    } catch (error: any) {
      const isLockTimeout =
        error.code === '55P03' ||
        error.meta?.code === '55P03' ||
        error.message?.includes('55P03') ||
        error.message?.includes('lock timeout');

      if (isLockTimeout) {
        throw new DomainException(
          'User wallet is being processed by another transaction. Please try again.',
          MessageCode.THROTTLE_TOO_MANY_REQUESTS,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw error;
    }
  }

  async findByUserId(userId: bigint): Promise<UserWallet[]> {
    const balances = await this.tx.userWallet.findMany({
      where: {
        userId,
      },
    });

    return balances.map((balance) => this.mapper.toDomain(balance));
  }

  async create(wallet: UserWallet): Promise<UserWallet> {
    const data = this.mapper.toPrisma(wallet);
    const result = await this.tx.userWallet.create({
      data,
    });
    return this.mapper.toDomain(result);
  }

  async list(options: UserWalletSearchOptions): Promise<[UserWallet[], number]> {
    const { userId, currency, status, page, limit } = options;

    const where = {
      userId,
      currency,
      status,
    };

    const [items, total] = await Promise.all([
      this.tx.userWallet.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.tx.userWallet.count({ where }),
    ]);

    return [items.map((item) => this.mapper.toDomain(item)), total];
  }

  async update(wallet: UserWallet): Promise<UserWallet> {
    const data = this.mapper.toPrisma(wallet);
    const result = await this.tx.userWallet.update({
      where: {
        userId_currency: {
          userId: data.userId,
          currency: data.currency,
        },
      },
      data,
    });
    return this.mapper.toDomain(result);
  }
}

