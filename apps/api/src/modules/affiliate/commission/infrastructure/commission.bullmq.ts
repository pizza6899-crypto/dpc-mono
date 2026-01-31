import { QueueConfig } from 'src/infrastructure/bullmq/bullmq.types';

export const AFFILIATE_QUEUES = {
    COMMISSION: {
        name: 'affiliate-commission-settle',
        defaultJobOptions: {
            attempts: 5,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: 100,
            removeOnFail: 500,
        },
        workerOptions: { concurrency: 1 },
        repeatableJobs: [
            {
                name: 'affiliate-commission-settle',
                repeat: { pattern: '0 0 1 * * *' },
            },
        ],
    },
} as const satisfies Record<string, QueueConfig>;
