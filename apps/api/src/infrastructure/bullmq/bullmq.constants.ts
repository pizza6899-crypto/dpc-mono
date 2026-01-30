// apps/api/src/infrastructure/bullmq/bullmq.constants.ts

import { RegisterQueueOptions } from '@nestjs/bullmq';
import { WorkerOptions } from 'bullmq';

import { Scope } from '@nestjs/common';

/**
 * NestJS BullMQ 전용 프로세서 설정
 */
export interface ProcessorOptions {
    name?: string;
    scope?: Scope;
    configKey?: string;
}

/**
 * 큐 설정 통합 인터페이스
 */
export interface QueueConfig extends RegisterQueueOptions {
    name: string;
    // NestJS 프로세서 데코레이터용 설정
    processorOptions?: ProcessorOptions;
    // BullMQ 워커 인스턴스용 설정 (connection을 선택적으로 만들어 NestJS와 호환)
    workerOptions?: Omit<WorkerOptions, 'connection'> & {
        connection?: WorkerOptions['connection'];
    };
    /**
     * [Proposed Feature] 초기화 시 자동 등록할 반복 작업(Cron) 목록
     * 나중에 BullMqSchedulerService가 이 필드를 읽어서 onModuleInit 시점에 add() 합니다.
     */
    repeatableJobs?: Array<{
        name: string; // Job ID 역할 (스케줄러 고유 식별자)
        data?: any; // Job Payload (옵션)
        repeat: {
            pattern: string; // Cron 패턴 (필수)
            tz?: string; // 타임존 (예: 'Asia/Seoul')
        };
    }>;
}

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
            name: 'casino-game-post-process', // BullMQ v5+ naming convention
            defaultJobOptions: {
                attempts: 999999, // 무제한 재시도 (중요 로직)
                backoff: { type: 'fixed', delay: 5000 },
                delay: 5000,
                removeOnComplete: 1000,
                removeOnFail: 5000,
            },
            workerOptions: {
                concurrency: 5,
            },
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
            workerOptions: {
                concurrency: 5,
            },
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
 * 특정 큐의 전체 설정을 이름을 기반으로 찾습니다.
 */
export function getQueueConfig(domain: keyof typeof BULLMQ_QUEUES, queueKey: string): QueueConfig & { processorOptions: ProcessorOptions; workerOptions: any } {
    const config = (BULLMQ_QUEUES[domain] as any)[queueKey] as QueueConfig;
    if (!config) throw new Error(`Queue config not found: ${domain}.${queueKey}`);

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
