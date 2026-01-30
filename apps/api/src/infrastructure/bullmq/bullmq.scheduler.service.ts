import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ALL_BULLMQ_QUEUES, QueueConfig } from './bullmq.constants';

@Injectable()
export class BullMqSchedulerService implements OnModuleInit {
    private readonly logger = new Logger(BullMqSchedulerService.name);

    constructor(private readonly moduleRef: ModuleRef) { }

    async onModuleInit() {
        this.logger.log('🔄 Initializing BullMQ Schedulers (Repeatable Jobs)...');

        for (const queueConfig of ALL_BULLMQ_QUEUES) {
            const config = queueConfig as QueueConfig;

            // repeatableJobs가 없으면 빈 배열로 초기화하여, 기존 등록된 잡이 있다면 모두 삭제(Cleanup)되도록 함.
            const targetJobs = config.repeatableJobs || [];

            const queueToken = getQueueToken(config.name);
            let queue: Queue;

            try {
                // strict: false 옵션으로 BullModule 등 다른 모듈에 있는 Provider도 검색
                queue = this.moduleRef.get(queueToken, { strict: false });
            } catch (error) {
                // 잡이 하나도 없으면 굳이 큐 인스턴스를 찾지 못해도 문제없음 (삭제할 것도 없으므로)
                if (targetJobs.length > 0) {
                    this.logger.warn(`⚠️ Queue instance not found via ModuleRef: ${config.name}. Make sure the queue is registered in BullModule.`);
                }
                continue;
            }

            // 1. 현재 Redis에 등록된 반복 작업 목록 조회
            const existingJobs = await queue.getJobSchedulers();

            // 2. 동기화: 불필요하거나 설정이 변경된 기존 스케줄 제거
            for (const job of existingJobs) {
                // job.name이 없는 경우도 방어적으로 처리 (보통 key에 정보가 있음)
                if (!job.name) continue;

                const definedJob = targetJobs.find(j => j.name === job.name);

                // Case 1: 상수에 정의되지 않은 잡 -> 삭제 (Obsolete)
                if (!definedJob) {
                    await queue.removeJobScheduler(job.key);
                    this.logger.log(`🗑️ Removed obsolete scheduler: [${config.name}] ${job.name} (Key: ${job.key})`);
                    continue;
                }

                // Case 2: 이름은 같지만 설정(Cron Pattern, Timezone)이 변경된 잡 -> 삭제 (Outdated)
                // BullMQ는 설정이 다르면 다른 Key를 생성하므로, 기존(구버전) Key를 명시적으로 지워줘야 함.
                // 주의: job.pattern 등은 Redis에서 가져온 값이므로 문자열 비교 시 공백 등 포맷이 다를 수 있음.
                // 하지만 보통 정확히 일치하므로 단순 비교로 처리.
                const isPatternSame = job.pattern === definedJob.repeat.pattern;
                // tz가 undefined인 경우와 null인 경우 등을 고려하여 비교 (BullMQ 기본값 처리 확인 필요하나 보통 문자열 비교면 충분)
                const isTzSame = job.tz === definedJob.repeat.tz;

                if (!isPatternSame || !isTzSame) {
                    await queue.removeJobScheduler(job.key);
                    this.logger.log(`🔄 Updating scheduler config: [${config.name}] ${job.name} (Old: ${job.pattern}/${job.tz} -> New: ${definedJob.repeat.pattern}/${definedJob.repeat.tz})`);
                }
            }

            // 3. (무조건) 최신 설정 등록 (Upsert)
            // BullMQ는 동일한 Key(Name+Pattern+TZ 등)가 이미 있으면 중복 생성하지 않고 무시/갱신 처리함.
            for (const jobConfig of targetJobs) {
                try {
                    await queue.add(jobConfig.name, jobConfig.data || {}, {
                        repeat: jobConfig.repeat,
                        jobId: `repeat:${jobConfig.name}`,
                    });

                    // 매번 로그 찍으면 시끄러우므로 디버그 레벨로 낮추거나, 최초 1회만 찍는게 좋음.
                    // 여기서는 확인을 위해 일단 log 유지
                    this.logger.debug(`✅ Synced scheduler: [${config.name}] ${jobConfig.name}`);
                } catch (err) {
                    this.logger.error(`❌ Failed to schedule ${jobConfig.name} on ${config.name}`, err);
                }
            }
        }
    }
}
