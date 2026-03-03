import { QueueConfig, BULLMQ_RETENTION } from 'src/infrastructure/bullmq/bullmq.types';

export const AUTH_QUEUES = {
  SESSION_CLEANUP: {
    name: 'auth-session-cleanup',
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: BULLMQ_RETENTION.DEFAULT_COMPLETED,
      removeOnFail: BULLMQ_RETENTION.DEFAULT_FAILED,
    },
    workerOptions: { concurrency: 1 },
    repeatableJobs: [
      {
        name: 'auth-session-cleanup',
        repeat: { pattern: '0 */5 * * * *' },
      },
    ],
  },
} as const satisfies Record<string, QueueConfig>;
