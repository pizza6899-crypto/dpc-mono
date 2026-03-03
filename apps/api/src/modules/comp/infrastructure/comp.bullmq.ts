import { QueueConfig, BULLMQ_RETENTION } from 'src/infrastructure/bullmq/bullmq.types';

export const COMP_QUEUES = {
    DAILY_SETTLEMENT: {
        name: 'comp-daily-settlement-scheduler',
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: BULLMQ_RETENTION.DEFAULT_COMPLETED,
            removeOnFail: BULLMQ_RETENTION.DEFAULT_FAILED,
        },
        workerOptions: { concurrency: 1 },
        repeatableJobs: [
            {
                name: 'comp-daily-settlement-scheduler',
                // Uses BULLMQ_DEFAULT_TIMEZONE (Asia/Tokyo) automatically by bullmq.scheduler.service.ts
                repeat: { pattern: '0 5 * * *' }, // Run daily at 5:00 AM JST
            },
        ],
    },
} as const satisfies Record<string, QueueConfig>;
