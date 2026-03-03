import { QueueConfig, BULLMQ_RETENTION } from 'src/infrastructure/bullmq/bullmq.types';

export const NOTIFICATION_QUEUES = {
  ALERT: {
    name: 'notification-alert',
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: BULLMQ_RETENTION.DEFAULT_COMPLETED,
      removeOnFail: BULLMQ_RETENTION.LONG_TERM_FAILED,
    },
    workerOptions: { concurrency: 5 },
  },
  EMAIL: {
    name: 'notification-channel-email',
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: BULLMQ_RETENTION.DEFAULT_COMPLETED,
      removeOnFail: BULLMQ_RETENTION.LONG_TERM_FAILED,
    },
    workerOptions: { concurrency: 10 },
  },
  SMS: {
    name: 'notification-channel-sms',
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: BULLMQ_RETENTION.DEFAULT_COMPLETED,
      removeOnFail: BULLMQ_RETENTION.LONG_TERM_FAILED,
    },
    workerOptions: { concurrency: 10 },
  },
  SOCKET: {
    name: 'notification-channel-socket',
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: BULLMQ_RETENTION.DEFAULT_COMPLETED,
      removeOnFail: BULLMQ_RETENTION.LONG_TERM_FAILED,
    },
    workerOptions: { concurrency: 20 },
  },
} as const satisfies Record<string, QueueConfig>;
