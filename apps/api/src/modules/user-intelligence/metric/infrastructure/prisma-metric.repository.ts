import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import {
  ICasinoMetricPort,
  IUserActivityMetricPort,
  IUserIntelligenceScorePort,
  IWalletMetricPort,
} from '../ports';

@Injectable()
export class PrismaMetricRepository
  implements
    IUserActivityMetricPort,
    ICasinoMetricPort,
    IWalletMetricPort,
    IUserIntelligenceScorePort
{
  constructor(private readonly prisma: PrismaService) {}

  // --- IUserActivityMetricPort ---

  async getSessionStats(userId: bigint, days: number = 30): Promise<{ activeDays: number; avgMinutes: number }> {
    const since = this.getDateAgo(days);

    const sessions = await this.prisma.userSession.findMany({
      where: {
        userId,
        createdAt: { gte: since },
      },
      select: {
        createdAt: true,
        lastActiveAt: true,
        revokedAt: true,
      },
    });

    if (sessions.length === 0) return { activeDays: 0, avgMinutes: 0 };

    const activeDates = new Set(sessions.map((s) => s.createdAt.toISOString().split('T')[0]));
    const totalMinutes = sessions.reduce((acc, s) => {
      const endAt = s.revokedAt || s.lastActiveAt;
      const diffMs = endAt.getTime() - s.createdAt.getTime();
      return acc + Math.max(0, diffMs / 1000 / 60);
    }, 0);

    return {
      activeDays: activeDates.size,
      avgMinutes: totalMinutes / sessions.length,
    };
  }

  async getCommunityStats(userId: bigint): Promise<{
    postCount: number;
    commentCount: number;
    chatCount: number;
    missionCompletionCount: number;
    missionCompletionRate: number;
  }> {
    const chatCount = await this.prisma.chatMessage.count({ where: { senderId: userId } });
    
    // 타 테이블(게시글 등)은 현재 스키마에 명시되지 않았으므로 0 처리
    return {
      postCount: 0,
      commentCount: 0,
      chatCount,
      missionCompletionCount: 0,
      missionCompletionRate: 0,
    };
  }

  async getDailySessionMinutes(userId: bigint, days: number): Promise<number[]> {
    const dailyMetrics = await this.prisma.userIntelligenceDailyMetric.findMany({
      where: { userId, date: { gte: this.getDateAgo(days) } },
      orderBy: { date: 'asc' },
      select: { sessionMinutes: true },
    });
    return dailyMetrics.map((m) => m.sessionMinutes);
  }

  // --- ICasinoMetricPort ---

  async getRollingStats(userId: bigint, days?: number): Promise<Prisma.Decimal> {
    const where: Prisma.CasinoGameRoundWhereInput = { userId };
    if (days) {
      where.startedAt = { gte: this.getDateAgo(days) };
    }

    const aggregate = await this.prisma.casinoGameRound.aggregate({
      where,
      _sum: { tierContributionUsd: true },
    });

    return aggregate._sum.tierContributionUsd || new Prisma.Decimal(0);
  }

  async getBettingStats(userId: bigint): Promise<{ bonusBettingRatio: number; excessBettingFactor: number }> {
    // 실제 보너스 베팅액 비율은 CasinoGameTransaction의 balanceType(CASH/BONUS) 집계가 필요하나,
    // 성능을 고려하여 우선 기본값 또는 간략화된 지표 반환
    return {
      bonusBettingRatio: 0.1,
      excessBettingFactor: 1.0,
    };
  }

  async getDailyRollingAmounts(userId: bigint, days: number): Promise<Prisma.Decimal[]> {
    const dailyMetrics = await this.prisma.userIntelligenceDailyMetric.findMany({
      where: { userId, date: { gte: this.getDateAgo(days) } },
      orderBy: { date: 'asc' },
      select: { rollingAmount: true },
    });
    return dailyMetrics.map((m) => m.rollingAmount);
  }

  // --- IWalletMetricPort ---

  async getDepositStats(userId: bigint, days?: number): Promise<{ totalUsd: Prisma.Decimal; count: number }> {
    const where: Prisma.DepositDetailWhereInput = { userId, status: 'COMPLETED' };
    if (days) {
      where.createdAt = { gte: this.getDateAgo(days) };
    }

    const aggregate = await this.prisma.depositDetail.aggregate({
      where,
      _sum: { actuallyPaid: true },
      _count: { _all: true },
    });

    return {
      totalUsd: aggregate._sum.actuallyPaid || new Prisma.Decimal(0),
      count: aggregate._count._all,
    };
  }

  async getNetLossStats(userId: bigint, days?: number): Promise<Prisma.Decimal> {
    const dateGte = days ? this.getDateAgo(days) : undefined;

    const depositSum = await this.prisma.depositDetail.aggregate({
      where: { userId, status: 'COMPLETED', createdAt: { gte: dateGte } },
      _sum: { actuallyPaid: true },
    });

    const withdrawalSum = await this.prisma.withdrawalDetail.aggregate({
      where: { userId, status: 'COMPLETED', createdAt: { gte: dateGte } },
      _sum: { netAmount: true },
    });

    const deposits = depositSum._sum.actuallyPaid || new Prisma.Decimal(0);
    const withdrawals = withdrawalSum._sum.netAmount || new Prisma.Decimal(0);

    return deposits.minus(withdrawals);
  }

  async getDailyWalletMetrics(userId: bigint, days: number): Promise<{ depositAmount: Prisma.Decimal; netLossAmount: Prisma.Decimal }[]> {
    const dailyMetrics = await this.prisma.userIntelligenceDailyMetric.findMany({
      where: { userId, date: { gte: this.getDateAgo(days) } },
      orderBy: { date: 'asc' },
      select: { depositAmount: true, netLossAmount: true },
    });
    return dailyMetrics;
  }

  // --- IUserIntelligenceScorePort ---

  async upsertScore(data: Prisma.UserIntelligenceScoreUncheckedCreateInput) {
    return this.prisma.userIntelligenceScore.upsert({
      where: { userId: data.userId },
      create: data,
      update: data,
    });
  }

  async upsertMetric(data: Prisma.UserIntelligenceMetricUncheckedCreateInput) {
    return this.prisma.userIntelligenceMetric.upsert({
      where: { userId: data.userId },
      create: data,
      update: data,
    });
  }

  async addHistory(data: Prisma.UserIntelligenceHistoryUncheckedCreateInput) {
    return this.prisma.userIntelligenceHistory.create({ data });
  }

  async findCurrentScore(userId: bigint) {
    return this.prisma.userIntelligenceScore.findUnique({ where: { userId } });
  }

  // --- Helpers ---

  private getDateAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(0, 0, 0, 0);
    return date;
  }
}
