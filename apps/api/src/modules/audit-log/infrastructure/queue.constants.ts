export const CRITICAL_LOG_QUEUE_NAME = 'critical-log-queue';
export const HEAVY_LOG_QUEUE_NAME = 'heavy-log-queue';

export const LOG_QUEUES = {
  CRITICAL: CRITICAL_LOG_QUEUE_NAME, // AUTH, INTEGRATION
  HEAVY: HEAVY_LOG_QUEUE_NAME,       // ACTIVITY, ERROR
} as const;

/**
 * Critical Log 큐 설정
 * 보안 및 결제/연동 데이터. 데이터 양은 적지만 절대 밀리거나 누락되면 안 됨. (우선순위 높음)
 * AuthAuditLog, IntegrationLog 사용
 */
export const CRITICAL_LOG_QUEUE_CONFIG = {
  name: CRITICAL_LOG_QUEUE_NAME,
  defaultJobOptions: {
    priority: 1, // 높은 우선순위
    attempts: 10, // 보안 로그는 실패 시 10번 재시도
    backoff: {
      type: 'exponential' as const,
      delay: 1000,
    },
    removeOnComplete: 1000, // 완료된 작업 보관
    removeOnFail: 500, // 실패한 작업 보관
  },
} as const;

/**
 * Heavy Log 큐 설정
 * 단순 활동 및 에러 기록. 데이터 양이 매우 많음. 처리 지연이 발생해도 시스템 운영에 치명적이지 않음.
 * UserActivityLog, SystemErrorLog 사용
 */
export const HEAVY_LOG_QUEUE_CONFIG = {
  name: HEAVY_LOG_QUEUE_NAME,
  defaultJobOptions: {
    priority: 0, // 낮은 우선순위
    attempts: 3, // 활동 로그는 실패 시 3번만 재시도
    backoff: {
      type: 'exponential' as const,
      delay: 2000,
    },
    removeOnComplete: 100, // 완료된 작업 보관 (적게 보관)
    removeOnFail: 50, // 실패한 작업 보관 (적게 보관)
  },
} as const;