import { QueueConfig, BULLMQ_RETENTION } from 'src/infrastructure/bullmq/bullmq.types';

/**
 * [UniversalLog] Redis 버퍼 및 프로세싱 키
 */
export const UNIVERSAL_LOG_KEYS = {
  BUFFER: 'universal-log:buffer',
  PROCESSING: 'universal-log:processing',
} as const;

/**
 * [UniversalLog] 전용 BullMQ 큐 설정 (배치 스케줄러 트리거용)
 */
export const UNIVERSAL_LOG_QUEUES = {
  SCHEDULER: {
    name: 'universal-log-batcher',
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: BULLMQ_RETENTION.DEFAULT_COMPLETED,
      removeOnFail: BULLMQ_RETENTION.DEFAULT_FAILED,
    },
    workerOptions: {
      concurrency: 1, // 동시성 1 (배치 처리는 순차적으로)
    },
    repeatableJobs: [
      {
        name: 'process-batch',
        repeat: { pattern: '*/5 * * * * *' }, // 5초마다 실행
      },
    ],
  },
} as const satisfies Record<string, QueueConfig>;
