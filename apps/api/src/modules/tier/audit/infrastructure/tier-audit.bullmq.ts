import { QueueConfig } from 'src/infrastructure/bullmq/bullmq.types';

export const TIER_QUEUES = {
    AUDIT: {
        name: 'tier-stats-snapshot',
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: 1000,
            removeOnFail: 5000,
        },
        workerOptions: { concurrency: 1 },
        repeatableJobs: [
            {
                name: 'tier-stats-snapshot',
                repeat: { pattern: '0 0 * * * *' },
            },
        ],
    },
} as const satisfies Record<string, QueueConfig>;
