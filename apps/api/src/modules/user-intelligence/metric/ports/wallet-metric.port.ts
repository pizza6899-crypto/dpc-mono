import { Prisma } from '@prisma/client';

export interface IWalletMetricPort {
  /**
   * 최근 N일간의 입금 합계 및 횟수 수집
   */
  getDepositStats(
    userId: bigint,
    days?: number,
  ): Promise<{ totalUsd: Prisma.Decimal; count: number }>;

  /**
   * 전체 또는 최근 N일간의 Net Loss (입출액 차액) 수집
   */
  getNetLossStats(userId: bigint, days?: number): Promise<Prisma.Decimal>;

  /**
   * CV 및 평점 계산을 위한 일별 입금/차액 리스트 수집
   */
  getDailyWalletMetrics(
    userId: bigint,
    days: number,
  ): Promise<{ depositAmount: Prisma.Decimal; netLossAmount: Prisma.Decimal }[]>;
}

export const WALLET_METRIC_PORT = Symbol('WALLET_METRIC_PORT');
