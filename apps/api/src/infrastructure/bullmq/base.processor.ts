// apps/api/src/infrastructure/bullmq/base.processor.ts

import { OnApplicationShutdown, Logger, Optional, Inject } from '@nestjs/common';
import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ClsService } from 'nestjs-cls';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import { BULLMQ_QUEUES } from './bullmq.constants';

/**
 * 모든 BullMQ 프로세서의 부모 클래스
 * 1. Graceful Shutdown (pause/close)
 * 2. nestjs-cls 컨텍스트 자동 생성 및 트레이싱 메타데이터 주입
 * 3. 런타임 에러 시 Audit Log 시스템 자동 연동
 * 4. 작업 소요 시간(Duration) 측정
 */
export abstract class BaseProcessor<T = any, R = any> extends WorkerHost implements OnApplicationShutdown {
    protected abstract readonly logger: Logger;
    protected abstract readonly cls: ClsService;

    // Audit Log 시스템 연동 (Optional 주익으로 순환 참조 및 의존성 문제 방지)
    @Optional()
    @Inject(DispatchLogService)
    protected readonly dispatchLogService?: DispatchLogService;

    /**
     * BullMQ의 process 메서드를 오버라이드하여 공통 인프라 로직을 수행합니다.
     */
    async process(job: Job<T>): Promise<R> {
        const startTime = Date.now();

        return this.cls.run(async () => {
            // CLS에 트레이싱 정보 주입 (로깅 및 트랜잭션 추적용)
            this.cls.set('jobId', job.id);
            this.cls.set('queueName', job.queueName);
            this.cls.set('attempt', job.attemptsMade + 1);

            try {
                this.logger.debug(`[Job 시작] ${job.queueName}:${job.name} (ID: ${job.id}, Attempt: ${job.attemptsMade + 1})`);

                const result = await this.processJob(job);

                const duration = Date.now() - startTime;
                this.logger.log(`[Job 완료] ${job.queueName} (ID: ${job.id}, Duration: ${duration}ms)`);

                return result;
            } catch (error) {
                const duration = Date.now() - startTime;

                // 감사 시스템 에러 보고
                await this.reportToAuditSystem(job, error, duration);

                this.logger.error(
                    `[Job 실패] ${job.queueName} (ID: ${job.id}, Duration: ${duration}ms) - ${error instanceof Error ? error.message : String(error)}`,
                    error instanceof Error ? error.stack : undefined,
                );

                throw error; // BullMQ 재시도 메커니즘을 위해 에러 다시 던짐
            }
        });
    }

    /**
     * 실제 비즈니스 로직을 구현하는 메서드입니다.
     * 
     * @note 타입 안전성 가이드:
     * 반환값(R) 타입은 컴파일 타임에만 유효합니다. 
     * 런타임 데이터 무결성이 중요한 경우, 구현체 내부에서 Zod 등으로 반환값을 검증하는 것을 권장합니다.
     */
    protected abstract processJob(job: Job<T>): Promise<R>;

    /**
     * 오류 발생 시 감사(Audit) 시스템에 기록
     */
    private async reportToAuditSystem(job: Job, error: any, duration: number) {
        // 무한 루프 방지: 감사 로그 큐 자체의 에러는 기록하지 않음
        const logQueues: string[] = [BULLMQ_QUEUES.AUDIT.CRITICAL.name, BULLMQ_QUEUES.AUDIT.HEAVY.name];
        if (logQueues.includes(job.queueName)) return;

        // Job Data 안전 처리 (길이 제한 및 순환 참조 방지)
        let safeJobData: any = job.data;
        try {
            const stringified = JSON.stringify(job.data);
            if (stringified.length > 5000) {
                safeJobData = {
                    _warning: 'Data truncated due to size limit',
                    preview: stringified.substring(0, 1000) + '...',
                };
            }
        } catch {
            safeJobData = { _error: 'Failed to stringify job data' };
        }

        if (this.dispatchLogService) {
            try {
                await this.dispatchLogService.dispatch({
                    type: LogType.ERROR,
                    data: {
                        errorCode: `QUEUE_ERROR:${job.queueName}`,
                        errorMessage: error instanceof Error ? error.message : String(error),
                        severity: 'ERROR',
                        stackTrace: error instanceof Error ? error.stack : undefined,
                        metadata: {
                            jobId: job.id,
                            jobName: job.name,
                            queue: job.queueName,
                            attempt: job.attemptsMade + 1,
                            duration: `${duration}ms`,
                            input: safeJobData,
                            status: 'FAIL',
                        },
                    },
                });
            } catch (auditError) {
                // 감사 로그 기록 자체의 실패는 표준 로그로만 남김
                this.logger.error('감사 로그 시스템 보고 중 오류 발생', auditError);
            }
        }
    }

    /**
     * Graceful Shutdown
     */
    async onApplicationShutdown(signal?: string): Promise<void> {
        const worker = this.worker;
        if (!worker) return;

        this.logger.log(`${this.constructor.name} 종료 프로세스 시작... (Signal: ${signal || 'N/A'})`);

        try {
            // 이미 닫혔거나 닫히는 중인지 확인 (BullMQ 내부 상태 접근이 어렵다면 try-catch로 방어)
            if (!worker.isPaused()) {
                await worker.pause();
            }
            await worker.close();
            this.logger.log(`${this.constructor.name} 워커가 안전하게 종료되었습니다.`);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            // 일반적인 '이미 닫힘' 류의 에러는 무시
            if (!msg.includes('closed') && !msg.includes('has not yet been initialized')) {
                this.logger.error(`${this.constructor.name} 종료 중 오류 발생`, error);
            }
        }
    }
}
