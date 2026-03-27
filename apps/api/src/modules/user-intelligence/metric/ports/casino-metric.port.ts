import { Prisma } from '@prisma/client';

export interface ICasinoMetricPort {
  /**
   * 최근 N일간의 유효 롤링(Betting) 총합 수집
   */
  getRollingStats(userId: bigint, days?: number): Promise<Prisma.Decimal>;

  /**
   * 초과 베팅 기여도 및 보너스 의존도 산 산출을 위한 지표 수집
   */
  getBettingStats(userId: bigint): Promise<{
    bonusBettingRatio: number; // 보너스 베팅액 / 전체 베팅액
    excessBettingFactor: number; // 입금 대비 초과 베팅 기여도 (0.03 기준)
  }>;

  /**
   * CV 계산을 위한 일별 롤링 금액 리스트 수집
   */
  getDailyRollingAmounts(userId: bigint, days: number): Promise<Prisma.Decimal[]>;
}

export const CASINO_METRIC_PORT = Symbol('CASINO_METRIC_PORT');
