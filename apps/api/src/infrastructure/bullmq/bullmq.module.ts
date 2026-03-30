// apps/api/src/infrastructure/bullmq/bullmq.module.ts

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EnvModule } from 'src/infrastructure/env/env.module';
import { EnvService } from 'src/infrastructure/env/env.service';
import { BullMqSchedulerService } from './bullmq.scheduler.service';
import { BULLMQ_PREFIX } from './bullmq.types';
import { ConcurrencyModule } from 'src/infrastructure/concurrency/concurrency.module';

/**
 * 프로젝트 전체의 BullMQ 인프라를 담당하는 모듈입니다.
 * 1. Redis 연결 설정 (Default & WORKER)
 * 2. 공통 스케줄러(Cron) 관리
 *
 * [주의] 각 도메인 큐는 해당 도메인 모듈(Feature Module)에서 직접 registerQueue() 해야 합니다.
 */
@Module({
  imports: [
    // 1. 인큐용 커넥션 (기본)
    BullModule.forRootAsync({
      useFactory: (envService: EnvService) => ({
        prefix: BULLMQ_PREFIX,
        connection: {
          host: envService.redis.host,
          port: envService.redis.port,
          password: envService.redis.password,
        },
      }),
      inject: [EnvService],
    }),
    // 2. 디큐용 커넥션 (워커 전용) - 이름만 'WORKER'로 지정
    BullModule.forRootAsync('WORKER', {
      useFactory: (envService: EnvService) => ({
        prefix: BULLMQ_PREFIX,
        connection: {
          host: envService.redis.host,
          port: envService.redis.port,
          password: envService.redis.password,
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      }),
      inject: [EnvService],
    }),
  ],
  providers: [BullMqSchedulerService],
  exports: [BullModule],
})
export class BullMqModule {}
