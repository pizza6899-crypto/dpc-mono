import { RegisterQueueOptions } from '@nestjs/bullmq';
import { WorkerOptions } from 'bullmq';
import { Scope } from '@nestjs/common';

export const BULLMQ_DEFAULT_TIMEZONE = 'Asia/Tokyo';

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
