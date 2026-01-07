// src/modules/affiliate/commission/infrastructure/affiliate-wallet.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { ExchangeCurrencyCode, Prisma } from '@repo/database';
import { AffiliateWallet, WalletNotFoundException } from '../domain';
import type { AffiliateWalletRepositoryPort } from '../ports/out/affiliate-wallet.repository.port';
import { AffiliateWalletMapper } from './affiliate-wallet.mapper';

@Injectable()
export class AffiliateWalletRepository implements AffiliateWalletRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: AffiliateWalletMapper,
  ) { }

  async findByAffiliateIdAndCurrency(
    affiliateId: bigint,
    currency: ExchangeCurrencyCode,
  ): Promise<AffiliateWallet | null> {
    const result = await this.tx.affiliateWallet.findUnique({
      where: {
        affiliateId_currency: {
          affiliateId,
          currency,
        },
      },
    });

    return result ? this.mapper.toDomain(result) : null;
  }

  async getByAffiliateIdAndCurrency(
    affiliateId: bigint,
    currency: ExchangeCurrencyCode,
  ): Promise<AffiliateWallet> {
    const wallet = await this.findByAffiliateIdAndCurrency(
      affiliateId,
      currency,
    );
    if (!wallet) {
      throw new WalletNotFoundException(affiliateId, currency);
    }
    return wallet;
  }

  async findByAffiliateId(affiliateId: bigint): Promise<AffiliateWallet[]> {
    const results = await this.tx.affiliateWallet.findMany({
      where: { affiliateId },
    });

    return results.map((result) => this.mapper.toDomain(result));
  }

  async upsert(wallet: AffiliateWallet): Promise<AffiliateWallet> {
    const data = this.mapper.toPrisma(wallet);
    const result = await this.tx.affiliateWallet.upsert({
      where: {
        affiliateId_currency: {
          affiliateId: data.affiliateId,
          currency: data.currency,
        },
      },
      create: {
        affiliateId: data.affiliateId,
        currency: data.currency,
        availableBalance: data.availableBalance,
        pendingBalance: data.pendingBalance,
        totalEarned: data.totalEarned,
        updatedAt: data.updatedAt,
      },
      update: {
        availableBalance: data.availableBalance,
        pendingBalance: data.pendingBalance,
        totalEarned: data.totalEarned,
        updatedAt: data.updatedAt,
      },
    });

    return this.mapper.toDomain(result);
  }

  async updateBalance(
    affiliateId: bigint,
    currency: ExchangeCurrencyCode,
    availableBalance: bigint,
    pendingBalance: bigint,
    totalEarned: bigint,
  ): Promise<AffiliateWallet> {
    const result = await this.tx.affiliateWallet.update({
      where: {
        affiliateId_currency: {
          affiliateId,
          currency,
        },
      },
      data: {
        availableBalance: new Prisma.Decimal(availableBalance.toString()),
        pendingBalance: new Prisma.Decimal(pendingBalance.toString()),
        totalEarned: new Prisma.Decimal(totalEarned.toString()),
      },
    });

    return this.mapper.toDomain(result);
  }
}
