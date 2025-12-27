// src/modules/affiliate/commission/infrastructure/affiliate-tier.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { AffiliateTierLevel, Prisma } from '@prisma/client';
import { AffiliateTier, TierNotFoundException } from '../domain';
import type { AffiliateTierRepositoryPort } from '../ports/out/affiliate-tier.repository.port';
import { AffiliateTierMapper } from './affiliate-tier.mapper';

@Injectable()
export class AffiliateTierRepository implements AffiliateTierRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
    private readonly mapper: AffiliateTierMapper,
  ) {}

  async findByAffiliateId(affiliateId: string): Promise<AffiliateTier | null> {
    const result = await this.tx.affiliateTier.findUnique({
      where: { affiliateId },
    });

    return result ? this.mapper.toDomain(result) : null;
  }

  async getByAffiliateId(affiliateId: string): Promise<AffiliateTier> {
    const tier = await this.findByAffiliateId(affiliateId);
    if (!tier) {
      throw new TierNotFoundException(affiliateId);
    }
    return tier;
  }

  async upsert(tier: AffiliateTier): Promise<AffiliateTier> {
    const data = this.mapper.toPrisma(tier);
    const result = await this.tx.affiliateTier.upsert({
      where: { affiliateId: data.affiliateId },
      create: {
        uid: data.uid,
        affiliateId: data.affiliateId,
        tier: data.tier,
        baseRate: data.baseRate,
        customRate: data.customRate,
        isCustomRate: data.isCustomRate,
        monthlyWagerAmount: data.monthlyWagerAmount,
        customRateSetBy: data.customRateSetBy,
        customRateSetAt: data.customRateSetAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      update: {
        tier: data.tier,
        baseRate: data.baseRate,
        customRate: data.customRate,
        isCustomRate: data.isCustomRate,
        monthlyWagerAmount: data.monthlyWagerAmount,
        customRateSetBy: data.customRateSetBy,
        customRateSetAt: data.customRateSetAt,
        updatedAt: data.updatedAt,
      },
    });

    return this.mapper.toDomain(result);
  }

  async updateTier(
    affiliateId: string,
    tier: AffiliateTierLevel,
    baseRate: bigint,
  ): Promise<AffiliateTier> {
    // bigint를 Prisma.Decimal로 변환 (10000 기준: 0.01 = 100)
    const baseRateDecimal = new Prisma.Decimal(baseRate.toString()).div(10000);

    const result = await this.tx.affiliateTier.update({
      where: { affiliateId },
      data: {
        tier,
        baseRate: baseRateDecimal,
        updatedAt: new Date(),
      },
    });

    return this.mapper.toDomain(result);
  }

  async updateMonthlyWagerAmount(
    affiliateId: string,
    monthlyWagerAmount: bigint,
  ): Promise<AffiliateTier> {
    const result = await this.tx.affiliateTier.update({
      where: { affiliateId },
      data: {
        monthlyWagerAmount: new Prisma.Decimal(monthlyWagerAmount.toString()),
        updatedAt: new Date(),
      },
    });

    return this.mapper.toDomain(result);
  }

  async resetMonthlyWagerAmount(affiliateId: string): Promise<AffiliateTier> {
    const result = await this.tx.affiliateTier.update({
      where: { affiliateId },
      data: {
        monthlyWagerAmount: new Prisma.Decimal(0),
        updatedAt: new Date(),
      },
    });

    return this.mapper.toDomain(result);
  }
}
