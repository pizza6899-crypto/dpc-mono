import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ALL_BULLMQ_QUEUES } from './bullmq.constants';
import { QueueConfig, BULLMQ_DEFAULT_TIMEZONE } from './bullmq.types';
import { EnvService } from 'src/common/env/env.service';
import Redis from 'ioredis';

@Injectable()
export class BullMqSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(BullMqSchedulerService.name);

  constructor(private readonly envService: EnvService) { }

  async onModuleInit() {
    this.logger.log('🔄 Initializing BullMQ Schedulers (Repeatable Jobs)...');

    const definedQueueNames = ALL_BULLMQ_QUEUES.map((q) => (q as QueueConfig).name);

    // 1. 유령 큐(코드에서 삭제되었으나 Redis에 남은 큐) 정리
    await this.purgeObsoleteQueues(definedQueueNames);

    // 2. 정의된 큐들에 대한 잡(Job) 동기화
    // repeatableJobs가 있는 큐만 필터링하여 처리
    const targetQueues = ALL_BULLMQ_QUEUES.filter(
      (q) =>
        (q as QueueConfig).repeatableJobs &&
        (q as QueueConfig).repeatableJobs!.length > 0,
    );

    for (const queueConfig of targetQueues) {
      const config = queueConfig as QueueConfig;
      const targetJobs = config.repeatableJobs || [];

      // 큐 인스턴스를 직접 생성 (NestJS 의존성 주입 없이 Redis 설정을 직접 사용)
      // 이는 전역 registerQueue 선언 여부와 관계없이 스케줄 동기화를 가능하게 합니다.
      const queue = new Queue(config.name, {
        connection: {
          host: this.envService.redis.host,
          port: this.envService.redis.port,
          password: this.envService.redis.password,
        },
      });

      try {
        // 1. 현재 Redis에 등록된 반복 작업 목록 조회
        const existingJobs = await queue.getJobSchedulers();

        // 2. 동기화: 불필요하거나 설정이 변경된 기존 스케줄 제거
        for (const job of existingJobs) {
          if (!job.name) continue;

          const definedJob = targetJobs.find((j) => j.name === job.name);

          // Case 1: 상수에 정의되지 않은 잡 -> 삭제 (Obsolete)
          if (!definedJob) {
            await queue.removeJobScheduler(job.key);
            this.logger.log(
              `🗑️ Removed obsolete scheduler: [${config.name}] ${job.name} (Key: ${job.key})`,
            );
            continue;
          }

          // Case 2: 이름은 같지만 설정(Cron Pattern, Timezone)이 변경된 잡 -> 삭제 (Outdated)
          const isPatternSame = job.pattern === definedJob.repeat.pattern;
          const definedTz = definedJob.repeat.tz || BULLMQ_DEFAULT_TIMEZONE;
          const isTzSame = job.tz === definedTz;

          // Case 3: 수동 지정한 jobId(repeat-${name}) 형식이 아닌 경우 (Old Legacy)
          const expectedId = `repeat-${definedJob.name}`;
          const isIdSame = job.id === expectedId;

          if (!isPatternSame || !isTzSame || !isIdSame) {
            await queue.removeJobScheduler(job.key);
            this.logger.log(
              `🔄 Updating scheduler config: [${config.name}] ${job.name} (Changed or Legacy ID removed)`,
            );
          }
        }

        // 3. (무조건) 최신 설정 등록 (Upsert)
        for (const jobConfig of targetJobs) {
          try {
            await queue.add(jobConfig.name, jobConfig.data || {}, {
              repeat: {
                tz: BULLMQ_DEFAULT_TIMEZONE, // 기본 타임존 적용
                ...jobConfig.repeat, // 개별 설정이 있으면 덮어씀
              },
              jobId: `repeat-${jobConfig.name}`,
            });

            this.logger.debug(
              `✅ Synced scheduler: [${config.name}] ${jobConfig.name}`,
            );
          } catch (err) {
            this.logger.error(
              `❌ Failed to schedule ${jobConfig.name} on ${config.name}`,
              err,
            );
          }
        }
      } finally {
        // 작업 완료 후 큐 연결 닫기
        await queue.close();
      }
    }
  }

  /**
   * 코드에서 삭제되었지만 Redis에 남아있는 유령 큐들의 리피터블 잡을 정리합니다.
   */
  private async purgeObsoleteQueues(definedQueueNames: string[]) {
    this.logger.log('🧹 Checking for obsolete BullMQ queues in Redis...');

    const redis = new Redis({
      host: this.envService.redis.host,
      port: this.envService.redis.port,
      password: this.envService.redis.password,
    });

    try {
      let cursor = '0';
      const redisQueues = new Set<string>();

      do {
        // MATCH 'bull:*:meta' 패턴으로 큐 메타데이터 키 스캔 (BullMQ 디폴트 prefix 'bull' 가정)
        const [nextCursor, keys] = await redis.scan(
          cursor,
          'MATCH',
          'bull:*:meta',
          'COUNT',
          100,
        );
        cursor = nextCursor;

        for (const key of keys) {
          // 키 형식: bull:queue-name:meta
          const parts = key.split(':');
          if (parts.length >= 3) {
            redisQueues.add(parts[1]);
          }
        }
      } while (cursor !== '0');

      for (const queueName of redisQueues) {
        if (!definedQueueNames.includes(queueName)) {
          this.logger.warn(
            `🗑️ Found obsolete queue: [${queueName}]. Obliterating...`,
          );

          const queue = new Queue(queueName, {
            connection: {
              host: this.envService.redis.host,
              port: this.envService.redis.port,
              password: this.envService.redis.password,
            },
          });

          try {
            // 큐의 모든 작업, 설정, 데이터를 완전히 삭제
            await queue.obliterate({ force: true });
            this.logger.log(`✅ Successfully obliterated queue: ${queueName}`);
          } catch (err) {
            this.logger.error(`❌ Failed to obliterate queue ${queueName}`, err);
          } finally {
            await queue.close();
          }
        }
      }
    } catch (error) {
      this.logger.error('❌ Failed to purge obsolete queues', error);
    } finally {
      await redis.quit();
    }
  }
}
