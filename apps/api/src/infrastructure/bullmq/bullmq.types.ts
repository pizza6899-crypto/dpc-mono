import type { RegisterQueueOptions } from '@nestjs/bullmq';
import type { WorkerOptions } from 'bullmq';
import type { Scope } from '@nestjs/common';

export const BULLMQ_DEFAULT_TIMEZONE = 'Asia/Tokyo';

/**
 * BullMQ 데이터 보관 제한 기본값
 */
export const BULLMQ_RETENTION = {
  DEFAULT_COMPLETED: 100, // 성공한 잡은 기본 100개 보관
  DEFAULT_FAILED: 1000,    // 실패한 잡은 디버깅을 위해 1000개 보관
  LONG_TERM_FAILED: 5000,  // 중요한 데이터의 경우 실패 내역을 더 길게 보관
} as const;

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
