import type { QueueConfig } from 'src/infrastructure/bullmq/bullmq.types';

export const NOTIFICATION_QUEUES = {
  ALERT: {
    name: 'notification-alert',
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
    workerOptions: { concurrency: 5 },
  },
  EMAIL: {
    name: 'notification-channel-email',
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
    workerOptions: { concurrency: 10 },
  },
  SMS: {
    name: 'notification-channel-sms',
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
    workerOptions: { concurrency: 10 },
  },
  SOCKET: {
    name: 'notification-channel-socket',
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
    workerOptions: { concurrency: 20 },
  },
} as const satisfies Record<string, QueueConfig>;
