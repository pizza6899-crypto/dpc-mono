// apps/api/src/infrastructure/bullmq/bullmq.constants.ts

import { RegisterQueueOptions } from '@nestjs/bullmq';
import { ProcessorOptions, QueueConfig } from './bullmq.types';

export * from './bullmq.types';

/**
 * 전역 BullMQ 큐 설정 레지스트리
 * 모든 도메인의 큐 이름, 기본 옵션, 동시성, 속도 제한을 여기서 중앙 관리합니다.
 */
export const BULLMQ_QUEUES = {
    // 감사 로그 도메인
    AUDIT: {
        CRITICAL: {
            name: 'audit-critical',
            defaultJobOptions: {
                attempts: 10,
                backoff: { type: 'exponential', delay: 1000 },
                removeOnComplete: 1000,
                removeOnFail: 5000,
            },
            workerOptions: {
                concurrency: 1, // 순서가 중요하거나 데이터 정합성이 중요한 경우 직렬 처리
            },
        },
        HEAVY: {
            name: 'audit-heavy',
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 2000 },
                removeOnComplete: 500,
                removeOnFail: 1000,
            },
            workerOptions: {
                concurrency: 10, // 대량 로그 처리를 위해 높은 동시성
            },
        },
    },
    // 카지노 도메인
    CASINO: {
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
            name: 'casino-whitecliff-history',
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 5000 },
                removeOnComplete: 100,
                removeOnFail: 500,
            },
            workerOptions: { concurrency: 1 },
            repeatableJobs: [
                {
                    name: 'whitecliff-pushed-bet-history',
                    repeat: { pattern: '0 * * * * *' }, // 매 분 0초
                },
            ],
        },
    },
    // 알림 도메인 (Notification)
    NOTIFICATION: {
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
    },
    // 등급 시스템 도메인 (Tier)
    TIER: {
        AUDIT: {
            name: 'tier-audit',
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 5000 },
                removeOnComplete: 1000,
                removeOnFail: 5000,
            },
            workerOptions: { concurrency: 1 },
            repeatableJobs: [
                {
                    name: 'tier-hourly-snapshot',
                    repeat: { pattern: '0 0 * * * *' }, // 매 시 정각
                },
            ],
        },
    },
    // 제휴 도메인 (Affiliate)
    AFFILIATE: {
        COMMISSION: {
            name: 'affiliate-commission',
            defaultJobOptions: {
                attempts: 5,
                backoff: { type: 'exponential', delay: 5000 },
                removeOnComplete: 100,
                removeOnFail: 500,
            },
            workerOptions: { concurrency: 1 },
            repeatableJobs: [
                {
                    name: 'settle-daily-commissions',
                    repeat: { pattern: '0 0 1 * * *', tz: 'UTC' }, // 매일 01:00 UTC
                },
            ],
        },
    },
    // 환율 도메인 (Exchange)
    EXCHANGE: {
        RATE_SYNC: {
            name: 'exchange-rate-sync',
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 5000 },
                removeOnComplete: 100,
                removeOnFail: 500,
            },
            workerOptions: { concurrency: 1 },
            repeatableJobs: [
                {
                    name: 'update-fiat-exchange-rates',
                    repeat: { pattern: '0 5 * * * *' }, // 매 시 5분 (정각 직후 지연 회피)
                },
            ],
        },
    },
    // 인증/보안 도메인 (Auth)
    AUTH: {
        SESSION_CLEANUP: {
            name: 'auth-session-cleanup',
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 5000 },
                removeOnComplete: 100,
                removeOnFail: 500,
            },
            workerOptions: { concurrency: 1 },
            repeatableJobs: [
                {
                    name: 'expire-sessions-batch',
                    repeat: { pattern: '0 */5 * * * *' }, // 매 5분마다
                },
            ],
        },
    },
} as const satisfies Record<string, Record<string, QueueConfig>>;

/**
 * BullBoard 등에 등록하기 위해 평탄화된 큐 옵션 목록을 반환합니다.
 * 
 * [주의] 
 * 1. 여기서 반환하는 config는 BullModule.registerQueue()에 사용되며, 이는 '인큐(Producer)'용입니다.
 * 2. 인큐는 기본 커넥션(Default)을 사용하도록 configKey를 주입하지 않습니다.
 * 3. 대신 각 도메인의 Processor 데코레이터에서 processorOptions를 참조하여 'WORKER' 커넥션을 사용하게 됩니다.
 */
export const ALL_BULLMQ_QUEUES: RegisterQueueOptions[] = Object.values(BULLMQ_QUEUES).flatMap((domain) =>
    Object.values(domain).map((config: QueueConfig) => {
        const { processorOptions, workerOptions, ...registerOptions } = config;
        return {
            ...registerOptions,
            // 인큐는 명시적으로 기본 커넥션을 사용 (생략시 default)
            configKey: undefined,
        };
    }),
);

/**
 * 특정 큐의 전체 설정을 보강합니다.
 */
export function getQueueConfig(config: QueueConfig): QueueConfig & { processorOptions: ProcessorOptions; workerOptions: any } {
    return {
        ...config,
        processorOptions: {
            name: config.name,
            configKey: 'WORKER', // 모든 워커는 자동으로 'WORKER' 커넥션 사용
            ...config.processorOptions,
        },
        workerOptions: config.workerOptions ?? {},
    };
}
