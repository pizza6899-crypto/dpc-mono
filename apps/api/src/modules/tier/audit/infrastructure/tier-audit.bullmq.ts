import type { QueueConfig } from 'src/infrastructure/bullmq/bullmq.types';

export const TIER_QUEUES = {
  STATS_AGGREGATION: {
    name: 'tier-stats-aggregation',
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 1000,
    },
    workerOptions: { concurrency: 1 },
    repeatableJobs: [
      {
        name: 'tier-stats-hourly-aggregation',
        repeat: { pattern: '0 0 * * * *' },
      },
    ],
  },
  STATS_RECORD: {
    name: 'tier-stats-record',
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
    workerOptions: { concurrency: 5 },
  },
} as const satisfies Record<string, QueueConfig>;
