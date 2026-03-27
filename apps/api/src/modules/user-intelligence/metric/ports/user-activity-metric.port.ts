export interface IUserActivityMetricPort {
  /**
   * 최근 N일간의 접속 일수 및 평균 세션 시간(분) 수집
   */
  getSessionStats(
    userId: bigint,
    days?: number,
  ): Promise<{ activeDays: number; avgMinutes: number }>;

  /**
   * 커뮤니티 활동량 (유효 세션 비율 수집 포함)
   */
  getCommunityStats(userId: bigint): Promise<{
    postCount: number;
    commentCount: number;
    chatCount: number;
    missionCompletionCount: number;
    missionCompletionRate: number;
  }>;

  /**
   * CV 계산을 위한 일별 세션 시간 리스트 수집
   */
  getDailySessionMinutes(userId: bigint, days: number): Promise<number[]>;
}

export const USER_ACTIVITY_METRIC_PORT = Symbol('USER_ACTIVITY_METRIC_PORT');
