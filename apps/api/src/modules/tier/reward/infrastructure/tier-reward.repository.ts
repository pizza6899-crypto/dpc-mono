import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import {
  TierRewardRepositoryPort,
  CreateTierRewardProps,
  FindRewardsQuery,
  PaginatedRewards,
} from './tier-reward.repository.port';
import { TierReward } from '../domain/tier-reward.entity';
import { TierUpgradeRewardStatus, Prisma } from '@prisma/client';

@Injectable()
export class TierRewardRepository implements TierRewardRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
  ) {}

  async create(props: CreateTierRewardProps): Promise<TierReward> {
    const record = await this.tx.tierUpgradeReward.create({
      data: {
        userId: props.userId,
        tierId: props.tierId,
        fromLevel: props.fromLevel,
        toLevel: props.toLevel,
        bonusAmountUsd: props.bonusAmountUsd,
        wageringMultiplier: props.wageringMultiplier,
        referenceId: props.referenceId,
        tierHistoryId: props.tierHistoryId,
        expiresAt: props.expiresAt,
        status: TierUpgradeRewardStatus.PENDING,
      },
      include: { tier: { include: { translations: true } } },
    });

    return TierReward.fromPersistence(record);
  }

  async findById(id: bigint): Promise<TierReward | null> {
    const record = await this.tx.tierUpgradeReward.findUnique({
      where: { id },
      include: { tier: { include: { translations: true } } },
    });

    return record ? TierReward.fromPersistence(record) : null;
  }

  async findPendingByUserId(userId: bigint): Promise<TierReward[]> {
    const records = await this.tx.tierUpgradeReward.findMany({
      where: {
        userId,
        status: TierUpgradeRewardStatus.PENDING,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: { tier: { include: { translations: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(TierReward.fromPersistence);
  }

  async findAll(query: FindRewardsQuery): Promise<PaginatedRewards> {
    const where: Prisma.TierUpgradeRewardWhereInput = {};

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.status && query.status.length > 0) {
      where.status = { in: query.status as TierUpgradeRewardStatus[] };
    }

    if (query.fromDate || query.toDate) {
      const createdAtCondition: Prisma.DateTimeFilter =
        (where.createdAt as Prisma.DateTimeFilter) || {};

      if (query.fromDate) {
        createdAtCondition.gte = query.fromDate;
      }
      if (query.toDate) {
        createdAtCondition.lte = query.toDate;
      }

      where.createdAt = createdAtCondition;
    }

    const [records, total] = await Promise.all([
      this.tx.tierUpgradeReward.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: { tier: { include: { translations: true } } },
      }),
      this.tx.tierUpgradeReward.count({ where }),
    ]);

    return {
      items: records.map(TierReward.fromPersistence),
      total,
    };
  }

  async save(reward: TierReward): Promise<TierReward> {
    const record = await this.tx.tierUpgradeReward.update({
      where: { id: reward.id },
      data: {
        status: reward.status,
        claimedAt: reward.claimedAt,
        walletTxId: reward.walletTxId,
        cancelledAt: reward.cancelledAt,
        cancelReason: reward.cancelReason,
        claimedCurrency: reward.claimedCurrency,
        exchangeRate: reward.exchangeRate,
        claimedAmount: reward.claimedAmount,
      },
      include: { tier: { include: { translations: true } } },
    });

    return TierReward.fromPersistence(record);
  }
}
