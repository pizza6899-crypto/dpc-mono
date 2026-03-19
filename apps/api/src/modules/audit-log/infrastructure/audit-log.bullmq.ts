import {
  QueueConfig,
  BULLMQ_RETENTION,
} from 'src/infrastructure/bullmq/bullmq.types';

export const AUDIT_QUEUES = {
  CRITICAL: {
    name: 'audit-log-critical',
    defaultJobOptions: {
      attempts: 10,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: BULLMQ_RETENTION.DEFAULT_COMPLETED,
      removeOnFail: BULLMQ_RETENTION.LONG_TERM_FAILED,
    },
    workerOptions: {
      concurrency: 1,
    },
  },
  HEAVY: {
    name: 'audit-log-heavy',
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: BULLMQ_RETENTION.DEFAULT_COMPLETED,
      removeOnFail: BULLMQ_RETENTION.DEFAULT_FAILED,
    },
    workerOptions: {
      concurrency: 10,
    },
  },
} as const satisfies Record<string, QueueConfig>;
