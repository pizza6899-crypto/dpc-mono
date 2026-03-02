import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  TierAuditRepositoryPort,
  UpdateTierStatsProps,
} from '../infrastructure/tier-audit.repository.port';
import {
  RecordTierSnapshotJobData,
  RecordTierHistoryJobData,
  RecordUserExpLogJobData,
} from '../infrastructure/tier-audit.types';

@Injectable()
export class HandleTierStatsService {
  constructor(private readonly auditRepository: TierAuditRepositoryPort) {}

  /**
   * BullMQ 프로세서에서 호출하는 실제 통계 저장 로직입니다.
   */
  async handleRecord(data: RecordTierSnapshotJobData): Promise<void> {
    const { timestamp, tierId, metrics } = data;

    // 시간 단위(Hourly) 정규화
    const normalizedTime = new Date(timestamp);
    normalizedTime.setUTCMinutes(0, 0, 0);

    const normalizedMetrics = this.normalizeMetrics(metrics);

    await this.auditRepository.updateStats(
      normalizedTime,
      BigInt(tierId),
      normalizedMetrics,
    );
  }

  /**
   * BullMQ 프로세서에서 호출하는 실제 통계 누적 로직입니다.
   */
  async handleIncrement(data: RecordTierSnapshotJobData): Promise<void> {
    const { timestamp, tierId, metrics } = data;
    const normalizedTime = new Date(timestamp);
    normalizedTime.setUTCMinutes(0, 0, 0);

    const normalizedMetrics = this.normalizeMetrics(metrics);

    await this.auditRepository.incrementStats(
      normalizedTime,
      BigInt(tierId),
      normalizedMetrics,
    );
  }

  /**
   * BullMQ 프로세서에서 호출하는 실제 티어 변경 이력 저장 로직입니다.
   */
  async handleTierHistory(data: RecordTierHistoryJobData): Promise<void> {
    await this.auditRepository.saveHistory({
      ...data,
      id: BigInt(data.id),
      userId: BigInt(data.userId),
      fromTierId: data.fromTierId ? BigInt(data.fromTierId) : null,
      toTierId: BigInt(data.toTierId),
      statusRollingUsdSnap: new Prisma.Decimal(data.statusRollingUsdSnap),
      compRateSnap: new Prisma.Decimal(data.compRateSnap),
      weeklyLossbackRateSnap: new Prisma.Decimal(data.weeklyLossbackRateSnap),
      monthlyLossbackRateSnap: new Prisma.Decimal(data.monthlyLossbackRateSnap),
      lifetimeRollingUsdSnap: new Prisma.Decimal(data.lifetimeRollingUsdSnap),
      lifetimeDepositUsdSnap: new Prisma.Decimal(data.lifetimeDepositUsdSnap),
      dailyWithdrawalLimitUsdSnap: new Prisma.Decimal(
        data.dailyWithdrawalLimitUsdSnap,
      ),
      weeklyWithdrawalLimitUsdSnap: new Prisma.Decimal(
        data.weeklyWithdrawalLimitUsdSnap,
      ),
      monthlyWithdrawalLimitUsdSnap: new Prisma.Decimal(
        data.monthlyWithdrawalLimitUsdSnap,
      ),
      upgradeBonusSnap: new Prisma.Decimal(data.upgradeBonusSnap),
      statusExpSnap: BigInt(data.statusExpSnap),
      changedBy: data.changedBy ? BigInt(data.changedBy) : null,
      referenceId: data.referenceId ? BigInt(data.referenceId) : null,
    });
  }

  /**
   * BullMQ 프로세서에서 호출하는 실제 XP 로그 저장 로직입니다.
   */
  async handleUserExpLog(data: RecordUserExpLogJobData): Promise<void> {
    await this.auditRepository.saveExpLog({
      ...data,
      id: BigInt(data.id),
      userId: BigInt(data.userId),
      amount: BigInt(data.amount),
      statusExpSnap: BigInt(data.statusExpSnap),
      referenceId: data.referenceId ? BigInt(data.referenceId) : null,
    });
  }

  private normalizeMetrics(
    metrics: RecordTierSnapshotJobData['metrics'],
  ): UpdateTierStatsProps {
    const decimalFields = [
      'periodRollingUsd',
      'periodPayoutUsd',
      'periodNetRevenueUsd',
      'periodUpgradeBonusPaidUsd',
      'periodCompPaidUsd',
      'periodLossbackPaidUsd',
      'periodDepositUsd',
      'periodWithdrawalUsd',
    ];

    const normalized: any = { ...metrics };

    for (const field of decimalFields) {
      if (metrics[field] !== undefined && metrics[field] !== null) {
        normalized[field] = new Prisma.Decimal(metrics[field]);
      }
    }

    return normalized as UpdateTierStatsProps;
  }
}
