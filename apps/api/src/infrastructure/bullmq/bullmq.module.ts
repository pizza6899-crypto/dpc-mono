// apps/api/src/infrastructure/bullmq/bullmq.module.ts

import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EnvModule } from 'src/common/env/env.module';
import { EnvService } from 'src/common/env/env.service';
import { ALL_BULLMQ_QUEUES } from './bullmq.constants';

/**
 * 프로젝트 전체의 BullMQ 인프라를 전용 모듈입니다.
 * 1. Redis 연결 설정 (Root)
 * 2. 모든 도메인 큐 등록 (Register)
 * 3. 전역(Global) 모듈로 설정하여 어디서든 InjectQueue 가능
 */
@Module({
    imports: [
        // 1. 인큐용 커넥션 (기본)
        BullModule.forRootAsync({
            imports: [EnvModule],
            useFactory: (envService: EnvService) => ({
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
            imports: [EnvModule],
            useFactory: (envService: EnvService) => ({
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
        // 중앙 집중식 큐 등록
        BullModule.registerQueue(...ALL_BULLMQ_QUEUES),
    ],
    exports: [BullModule],
})
export class BullMqModule { }
