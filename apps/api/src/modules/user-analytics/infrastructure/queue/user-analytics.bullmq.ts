import {
  QueueConfig,
  BULLMQ_RETENTION,
} from 'src/infrastructure/bullmq/bullmq.types';
import { UserWalletTransactionType } from '@prisma/client';

/**
 * 전역 통계 동기화 큐 페이로드 타입
 */
export interface UserAnalyticsSyncPayload {
  userId: string; // BigInt -> String (JSON)
  type: UserWalletTransactionType;
  amountUsd: string; // Decimal -> String (JSON)
  timestamp: string; // Date -> ISOString (JSON)
}

export const USER_ANALYTICS_JOBS = {
  SYNC: 'sync-user-analytics',
} as const;

export const USER_ANALYTICS_QUEUES = {
  SYNC: {
    name: 'user-analytics-sync',
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: BULLMQ_RETENTION.DEFAULT_COMPLETED,
      removeOnFail: BULLMQ_RETENTION.DEFAULT_FAILED,
    },
    workerOptions: { concurrency: 10 }, // 여러 트랜잭션 병렬 처리 허용
  },
} as const satisfies Record<string, QueueConfig>;
