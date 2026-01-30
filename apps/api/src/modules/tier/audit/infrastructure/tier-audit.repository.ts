import { Injectable } from '@nestjs/common';
import { EvaluationStatus } from '@prisma/client';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import {
  TierAuditRepositoryPort,
  CreateTierHistoryProps,
  UpdateEvaluationLogMetrics,
  UpdateTierStatsProps,
} from './audit.repository.port';
import { TierHistory } from '../domain/tier-history.entity';
import { TierEvaluationLog } from '../domain/tier-evaluation-log.entity';

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
        changeBy: props.changeBy || 'SYSTEM',
      },
    });
    return TierHistory.fromPersistence(record);
  }

  async findHistoryByUserId(
    userId: bigint,
    limit: number = 20,
  ): Promise<TierHistory[]> {
    const records = await this.tx.tierHistory.findMany({
      where: { userId },
      take: limit,
      orderBy: { changedAt: 'desc' },
    });
    return records.map(TierHistory.fromPersistence);
  }

  // --- Evaluation Log ---
  async createEvaluationLog(
    id: bigint,
    timestamp: Date,
    status: EvaluationStatus,
  ): Promise<TierEvaluationLog> {
    const record = await this.tx.tierEvaluationLog.create({
      data: {
        id,
        status,
        startedAt: timestamp,
        totalProcessedCount: 0,
        promotedCount: 0,
        demotedCount: 0,
        gracePeriodCount: 0,
        maintainedCount: 0,
        skippedBonusCount: 0,
      },
    });
    return TierEvaluationLog.fromPersistence(record);
  }

  async updateEvaluationLog(
    id: bigint,
    startedAt: Date,
    data: UpdateEvaluationLogMetrics & {
      status?: EvaluationStatus;
      finishedAt?: Date;
      errorMessage?: string | null;
    },
  ): Promise<TierEvaluationLog> {
    const record = await this.tx.tierEvaluationLog.update({
      where: { id_startedAt: { id, startedAt } },
      data,
    });
    return TierEvaluationLog.fromPersistence(record);
  }

  async findEvaluationLogs(limit: number = 20): Promise<TierEvaluationLog[]> {
    const records = await this.tx.tierEvaluationLog.findMany({
      take: limit,
      orderBy: { startedAt: 'desc' },
    });
    return records.map(TierEvaluationLog.fromPersistence);
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
}
