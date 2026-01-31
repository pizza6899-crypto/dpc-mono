import { RegisterQueueOptions } from '@nestjs/bullmq';
import { QueueConfig } from './bullmq.types';
import { AUDIT_QUEUES } from 'src/modules/audit-log/infrastructure/audit-log.bullmq';
import { CASINO_QUEUES } from 'src/modules/casino/infrastructure/casino.bullmq';
import { NOTIFICATION_QUEUES } from 'src/modules/notification/infrastructure/notification.bullmq';
import { TIER_QUEUES } from 'src/modules/tier/audit/infrastructure/tier-audit.bullmq';
import { TIER_EVALUATOR_QUEUES } from 'src/modules/tier/evaluator/infrastructure/tier-evaluator.bullmq';
import { AFFILIATE_QUEUES } from 'src/modules/affiliate/commission/infrastructure/commission.bullmq';
import { EXCHANGE_QUEUES } from 'src/modules/exchange/infrastructure/exchange.bullmq';
import { AUTH_QUEUES } from 'src/modules/auth/session/infrastructure/session.bullmq';

/**
 * 전역 BullMQ 큐 설정 레지스트리 (Aggregation)
 * 각 도메인 모듈에서 정의한 설정을 하나로 모으는 역할을 합니다.
 */
export const BULLMQ_REGISTRY = {
    AUDIT: AUDIT_QUEUES,
    CASINO: CASINO_QUEUES,
    NOTIFICATION: NOTIFICATION_QUEUES,
    TIER: TIER_QUEUES,
    TIER_EVALUATOR: TIER_EVALUATOR_QUEUES,
    AFFILIATE: AFFILIATE_QUEUES,
    EXCHANGE: EXCHANGE_QUEUES,
    AUTH: AUTH_QUEUES,
} as const;

/**
 * BullMqSchedulerService 등에서 사용하기 위한 평탄화된 큐 목록
 */
export const ALL_BULLMQ_QUEUES: RegisterQueueOptions[] = Object.values(BULLMQ_REGISTRY).flatMap((domain) =>
    Object.values(domain).map((config: QueueConfig) => {
        const { processorOptions, workerOptions, ...registerOptions } = config;
        return {
            ...registerOptions,
            configKey: undefined,
        };
    }),
);
