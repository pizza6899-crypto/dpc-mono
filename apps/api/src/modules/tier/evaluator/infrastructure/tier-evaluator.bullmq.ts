import type { QueueConfig } from 'src/infrastructure/bullmq/bullmq.types';

export const TIER_EVALUATOR_QUEUES = {
  // 1. 심사 트리거 큐 (매시간 정기적으로 심사 시작)
  EVALUATION_TRIGGER: {
    name: 'tier-evaluation-trigger',
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 1000,
    },
    workerOptions: { concurrency: 1 },
    repeatableJobs: [
      {
        name: 'tier-evaluation-hourly-trigger',
        repeat: { pattern: '0 10 * * * *' }, // 매시간 10분에 심사 시작
      },
    ],
  },
  // 2. 개별 유저 심사 큐 (실제 판정 로직 수행)
  USER_EVALUATION: {
    name: 'tier-user-evaluation',
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
    workerOptions: { concurrency: 5 }, // 5명의 유저를 동시에 심사
  },
} as const satisfies Record<string, QueueConfig>;
