// apps/api/src/infrastructure/bullmq/bullmq.constants.ts

import { ProcessorOptions, QueueConfig } from './bullmq.types';
import { BULLMQ_REGISTRY, ALL_BULLMQ_QUEUES as REGISTRY_ALL_QUEUES } from './bullmq.registry';

export * from './bullmq.types';

/**
 * 전역 BullMQ 큐 설정 레지스트리 (Bridge)
 * 하위 호환성을 위해 유지하며, 실제 설정은 각 도메인의 *.bullmq.ts 파일에 있습니다.
 */
export const BULLMQ_QUEUES = BULLMQ_REGISTRY;

export const ALL_BULLMQ_QUEUES = REGISTRY_ALL_QUEUES;

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
