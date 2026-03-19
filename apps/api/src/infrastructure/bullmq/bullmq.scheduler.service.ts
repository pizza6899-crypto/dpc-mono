import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ALL_BULLMQ_QUEUES } from './bullmq.constants';
import {
  QueueConfig,
  BULLMQ_DEFAULT_TIMEZONE,
  BULLMQ_PREFIX,
} from './bullmq.types';
import { EnvService } from 'src/common/env/env.service';
import { ConcurrencyService, GlobalLockKey } from 'src/common/concurrency';
import Redis from 'ioredis';

@Injectable()
export class BullMqSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(BullMqSchedulerService.name);

  constructor(
    private readonly envService: EnvService,
    private readonly concurrencyService: ConcurrencyService,
  ) {}

  async onModuleInit() {
    // 분산 환경에서 한 대의 서버만 동기화 로직을 수행하도록 Global Lock 적용
    await this.concurrencyService.runExclusive(
      GlobalLockKey.BULLMQ_SCHEDULER_INIT,
      async () => {
        await this.syncSchedulers();
      },
      { timeoutSeconds: 300 }, // 초기화 작업이므로 넉넉하게 5분 설정
    );
  }

  private async syncSchedulers() {
    this.logger.log('🔄 Initializing BullMQ Schedulers (Repeatable Jobs)...');

    const definedQueueNames = ALL_BULLMQ_QUEUES.map(
      (q) => (q as QueueConfig).name,
    );

    // 1. 유령 큐(코드에서 삭제되었으나 Redis에 남은 큐) 정리
    await this.purgeObsoleteQueues(definedQueueNames);

    // 2. 정의된 모든 큐에 대해 반복 작업(Repeatable Jobs) 동기화
    // (예전에는 repeatableJobs가 있는 큐만 필터링했으나,
    // 기존에 있던 작업을 모두 삭제한 큐의 정리 작업을 위해 모든 큐를 순회합니다.)
    for (const queueConfig of ALL_BULLMQ_QUEUES) {
      const config = queueConfig as QueueConfig;
      const targetJobs = config.repeatableJobs || [];

      const queue = new Queue(config.name, {
        prefix: BULLMQ_PREFIX,
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

          // Case 3: 레거시 수동 지정 ID(repeat-${name})가 남아있는 경우 -> 삭제 (Migration)
          // 이제 BullMQ 표준 ID(repeat:<hash>)를 사용하기 위해 기존 수동 ID를 정리합니다.
          const isLegacyId = job.id === `repeat-${definedJob.name}`;

          if (!isPatternSame || !isTzSame || isLegacyId) {
            await queue.removeJobScheduler(job.key);
            this.logger.log(
              `🔄 Updating scheduler config: [${config.name}] ${job.name} (Key: ${job.key}${isLegacyId ? ', Legacy ID removed' : ''})`,
            );
          }
        }

        // 3. (무조건) 최신 설정 등록 (Upsert)
        for (const jobConfig of targetJobs) {
          try {
            await queue.add(jobConfig.name, jobConfig.data || {}, {
              repeat: {
                tz: BULLMQ_DEFAULT_TIMEZONE,
                ...jobConfig.repeat,
              },
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
        await queue.close();
      }
    }
  }

  /**
   * 코드에서 삭제되었지만 Redis에 남아있는 유령 큐들의 리피터블 잡을 정리합니다.
   */
  private async purgeObsoleteQueues(definedQueueNames: string[]) {
    // 안전장치: 정의된 큐 목록이 비어있으면 실행 중단 (실수로 모든 큐가 날아가는 것 방지)
    if (definedQueueNames.length === 0) {
      this.logger.warn(
        '⚠️ No BullMQ queues defined. Skipping purge to prevent accidental data loss.',
      );
      return;
    }

    this.logger.log('🧹 Checking for obsolete BullMQ queues in Redis...');

    const redis = new Redis({
      host: this.envService.redis.host,
      port: this.envService.redis.port,
      password: this.envService.redis.password,
    });

    try {
      let cursor = '0';
      const redisQueues = new Set<string>();
      const scanPattern = `${BULLMQ_PREFIX}:*:meta`;

      do {
        const [nextCursor, keys] = await redis.scan(
          cursor,
          'MATCH',
          scanPattern,
          'COUNT',
          100,
        );
        cursor = nextCursor;

        for (const key of keys) {
          // 키 형식: {prefix}:{queue-name}:meta
          const parts = key.split(':');
          // prefix가 ':'를 포함할 수 있으므로, 뒤에서부터 계산하거나 parts 구조를 고려해야 함
          // dpc:bull:queue-name:meta -> parts = ['dpc', 'bull', 'queue-name', 'meta']
          if (parts.length >= 3) {
            const queueName = parts[parts.length - 2];
            redisQueues.add(queueName);
          }
        }
      } while (cursor !== '0');

      for (const queueName of redisQueues) {
        if (!definedQueueNames.includes(queueName)) {
          this.logger.warn(
            `🗑️ Found obsolete queue: [${queueName}]. Obliterating...`,
          );

          const queue = new Queue(queueName, {
            prefix: BULLMQ_PREFIX,
            connection: {
              host: this.envService.redis.host,
              port: this.envService.redis.port,
              password: this.envService.redis.password,
            },
          });

          try {
            await queue.obliterate({ force: true });
            this.logger.log(`✅ Successfully obliterated queue: ${queueName}`);
          } catch (err) {
            this.logger.error(
              `❌ Failed to obliterate queue ${queueName}`,
              err,
            );
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
