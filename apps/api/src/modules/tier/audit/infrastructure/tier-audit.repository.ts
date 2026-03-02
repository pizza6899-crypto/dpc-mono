import { Injectable } from '@nestjs/common';
import { Prisma, TierChangeType, ExpSourceType } from '@prisma/client';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import {
  TierAuditRepositoryPort,
  CreateTierHistoryProps,
  UpdateTierStatsProps,
  CreateUserExpLogProps,
} from './tier-audit.repository.port';
import { TierHistory } from '../domain/tier-history.entity';
import { UserExpLog } from '../domain/user-exp-log.entity';
import { PaginatedData } from 'src/common/http/types/pagination.types';

@Injectable()
export class TierAuditRepository implements TierAuditRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
  ) {}

  // --- History ---
  async saveHistory(props: CreateTierHistoryProps): Promise<TierHistory> {
    const record = await this.tx.tierHistory.create({
      data: {
        ...props,
      },
    });
    return TierHistory.fromPersistence(record);
  }

  async findHistoryByUserId(
    userId: bigint,
    params: {
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
      changeType?: TierChangeType;
    } = {},
  ): Promise<PaginatedData<TierHistory>> {
    const { startDate, endDate, page = 1, limit = 20, changeType } = params;
    const where: Prisma.TierHistoryWhereInput = {
      userId,
    };

    if (startDate || endDate) {
      where.changedAt = {};
      if (startDate) where.changedAt.gte = startDate;
      if (endDate) where.changedAt.lte = endDate;
    }

    if (changeType) {
      where.changeType = changeType;
    }

    const [total, records] = await Promise.all([
      this.tx.tierHistory.count({ where }),
      this.tx.tierHistory.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { changedAt: 'desc' },
      }),
    ]);

    return {
      data: records.map(TierHistory.fromPersistence),
      total,
      page,
      limit,
    };
  }

  // --- XP Log ---
  async saveExpLog(props: CreateUserExpLogProps): Promise<UserExpLog> {
    const record = await this.tx.userExpLog.create({
      data: {
        ...props,
      },
    });
    return UserExpLog.fromPersistence(record);
  }

  async findExpLogsByUserId(
    userId: bigint,
    params: {
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
      sourceType?: ExpSourceType;
    } = {},
  ): Promise<PaginatedData<UserExpLog>> {
    const { startDate, endDate, page = 1, limit = 20, sourceType } = params;
    const where: Prisma.UserExpLogWhereInput = {
      userId,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    if (sourceType) {
      where.sourceType = sourceType;
    }

    const [total, records] = await Promise.all([
      this.tx.userExpLog.count({ where }),
      this.tx.userExpLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: records.map(UserExpLog.fromPersistence),
      total,
      page,
      limit,
    };
  }

  // --- Stats ---
  async updateStats(
    timestamp: Date,
    tierId: bigint,
    data: UpdateTierStatsProps,
  ): Promise<void> {
    await this.tx.tierStats.upsert({
      where: { timestamp_tierId: { timestamp, tierId } },
      create: { timestamp, tierId, ...data },
      update: data,
    });
  }

  async incrementStats(
    timestamp: Date,
    tierId: bigint,
    data: Partial<Record<keyof UpdateTierStatsProps, number | Prisma.Decimal>>,
  ): Promise<void> {
    const createData: any = { timestamp, tierId };
    const updateData: any = {};

    for (const [key, value] of Object.entries(data)) {
      updateData[key] = { increment: value };
      createData[key] = value;
    }

    await this.tx.tierStats.upsert({
      where: { timestamp_tierId: { timestamp, tierId } },
      create: createData,
      update: updateData,
    });
  }
}
