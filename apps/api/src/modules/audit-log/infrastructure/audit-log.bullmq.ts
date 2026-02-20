import type { QueueConfig } from 'src/infrastructure/bullmq/bullmq.types';

export const AUDIT_QUEUES = {
  CRITICAL: {
    name: 'audit-log-critical',
    defaultJobOptions: {
      attempts: 10,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
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
      removeOnComplete: 500,
      removeOnFail: 1000,
    },
    workerOptions: {
      concurrency: 10,
    },
  },
} as const satisfies Record<string, QueueConfig>;
