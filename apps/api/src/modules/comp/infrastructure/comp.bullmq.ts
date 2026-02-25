import type { QueueConfig } from 'src/infrastructure/bullmq/bullmq.types';

export const COMP_QUEUES = {
    DAILY_SETTLEMENT: {
        name: 'comp-daily-settlement-scheduler',
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: 100,
            removeOnFail: 500,
        },
        workerOptions: { concurrency: 1 },
        repeatableJobs: [
            {
                name: 'comp-daily-settlement-scheduler',
                repeat: { pattern: '0 5 * * *', tz: 'Asia/Tokyo' }, // Run daily at 5:00 AM JST
            },
        ],
    },
} as const satisfies Record<string, QueueConfig>;
