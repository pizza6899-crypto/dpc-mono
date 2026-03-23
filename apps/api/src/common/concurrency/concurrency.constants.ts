/**
 * PostgreSQL Advisory Lock을 위한 네임스페이스 정의
 *
 * 64비트 정수 키 생성 시 해싱의 시드값으로 사용됩니다.
 * 각 모듈별로 고유한 값을 할당하여 충돌을 방지합니다.
 */
export enum LockNamespace {
  AFFILIATE_CODE = 1001,
  TIER_CREATION = 1002,
  USER_TIER = 1003,
  USER_WALLET = 1004,
  DEPOSIT = 1005,
  USER_DEPOSIT = 1006,
  COMP_ACCOUNT = 1007,
  PROMOTION = 1008,
  PAYMENT_TOKEN = 1009,
  WITHDRAWAL = 1010,
  USER_WITHDRAWAL = 1011,
  USER_REWARD = 1012,

  // Casino
  GAME_ROUND = 2002,
  CASINO_SESSION = 2003,

  // 향후 추가될 네임스페이스들
  USER_CONFIG = 1013,
  CHAT_ROOM = 1014,
  TIER_REWARD = 1015,
  USER_CHAT_SUPPORT = 1016,
  GAMIFICATION_CHARACTER = 1017,
}

export const CONCURRENCY_CONSTANTS = {
  // Database Advisory Lock Timeout
  DB_LOCK_TIMEOUT: '3s',
};

/**
 * Global Lock (Table-based) Keys
 * - 스케줄러 등 분산 락 식별자로 사용되는 키값 모음
 */
export const GlobalLockKey = {
  // Tier Audit
  TIER_AUDIT_HOURLY_STATS: 'tier-audit:hourly-stats',

  // Affiliate
  AFFILIATE_DAILY_COMMISSION: 'settle-daily-commissions-scheduler',

  // Auth
  AUTH_EXPIRE_SESSIONS: 'expire-sessions-scheduler',

  // Exchange
  EXCHANGE_RATE_UPDATE: 'exchange-rate-update-scheduler',

  // Casino
  WHITECLIFF_PUSHED_BET_HISTORY: 'whitecliff-pushed-bet-history-scheduler',

  // System
  BULLMQ_SCHEDULER_INIT: 'bullmq:scheduler-init',
} as const;

export type GlobalLockKey = (typeof GlobalLockKey)[keyof typeof GlobalLockKey];
