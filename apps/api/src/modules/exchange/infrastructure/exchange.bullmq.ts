import {
  QueueConfig,
  BULLMQ_RETENTION,
} from 'src/infrastructure/bullmq/bullmq.types';

export const EXCHANGE_QUEUES = {
  RATE_SYNC: {
    name: 'exchange-rate-sync',
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: BULLMQ_RETENTION.DEFAULT_COMPLETED,
      removeOnFail: BULLMQ_RETENTION.DEFAULT_FAILED,
    },
    workerOptions: { concurrency: 1 },
    repeatableJobs: [
      {
        name: 'exchange-rate-sync',
        repeat: { pattern: '0 5 * * * *' },
      },
    ],
  },
} as const satisfies Record<string, QueueConfig>;
