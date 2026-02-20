import type { QueueConfig } from 'src/infrastructure/bullmq/bullmq.types';
import { BULLMQ_DEFAULT_TIMEZONE } from 'src/infrastructure/bullmq/bullmq.types';

export const CASINO_QUEUES = {
  GAME_POST_PROCESS: {
    name: 'casino-game-post-process',
    defaultJobOptions: {
      attempts: 999999,
      backoff: { type: 'fixed', delay: 5000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
    workerOptions: { concurrency: 5 },
  },
  GAME_RESULT_FETCH: {
    name: 'casino-game-result-fetch',
    defaultJobOptions: {
      attempts: 10,
      backoff: { type: 'exponential', delay: 5000 },
      delay: 5000,
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
    workerOptions: { concurrency: 5 },
  },
  WHITECLIFF_HISTORY: {
    name: 'casino-whitecliff-pushed-bets',
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
    workerOptions: { concurrency: 1 },
    repeatableJobs: [
      {
        name: 'casino-whitecliff-pushed-bets',
        repeat: { pattern: '0 * * * * *' }, // tz 제거 (글로벌 기본값 사용)
      },
    ],
  },
} as const satisfies Record<string, QueueConfig>;
