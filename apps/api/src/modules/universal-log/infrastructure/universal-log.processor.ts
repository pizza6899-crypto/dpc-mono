import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Inject } from '@nestjs/common';
import { UNIVERSAL_LOG_REPOSITORY_PORT, UniversalLogRepositoryPort } from '../ports/universal-log.repository.port';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import { getQueueConfig } from 'src/infrastructure/bullmq/bullmq.constants';
import { UNIVERSAL_LOG_QUEUES, UNIVERSAL_LOG_KEYS } from './universal-log.bullmq';
import { ClsService } from 'nestjs-cls';
import { UniversalLog } from '../domain/universal-log.entity';
import { RedisService } from 'src/infrastructure/redis/redis.service';

const schedulerConfig = getQueueConfig(UNIVERSAL_LOG_QUEUES.SCHEDULER);

/**
 * [UniversalLog] 배치 처리 프로세서
 * Redis List 버퍼에서 데이터를 대량으로 꺼내 DB에 Bulk Insert 합니다.
 */
@Processor(schedulerConfig.processorOptions, schedulerConfig.workerOptions)
export class UniversalLogProcessor extends BaseProcessor<any, void> {
  protected readonly logger = new Logger(UniversalLogProcessor.name);

  constructor(
    @Inject(UNIVERSAL_LOG_REPOSITORY_PORT)
    private readonly logRepository: UniversalLogRepositoryPort,
    private readonly redis: RedisService,
    protected readonly cls: ClsService,
  ) {
    super();
  }

  /**
   * 5초마다 실행되는 배치 작업 트리거
   */
  protected async processJob(job: Job<any>): Promise<void> {
    const BATCH_SIZE = 1000;
    const client = this.redis.getClient();

    // 1. 이전 작업에서 실패한 'PROCESSING' 데이터가 있다면 먼저 처리 (Recovery)
    await this.processBuffer(UNIVERSAL_LOG_KEYS.PROCESSING, BATCH_SIZE);

    // 2. 메인 버퍼 처리
    await this.processBuffer(UNIVERSAL_LOG_KEYS.BUFFER, BATCH_SIZE);
  }

  /**
   * 특정 리스트의 데이터를 배치로 처리
   */
  private async processBuffer(sourceKey: string, batchSize: number): Promise<void> {
    const client = this.redis.getClient();
    const isMainBuffer = sourceKey === UNIVERSAL_LOG_KEYS.BUFFER;

    while (true) {
      const batchItems: string[] = [];

      // Atomic 이동: 버퍼에서 처리용 대기열로 이동 (LMOVE)
      // 메인 버퍼인 경우에만 이동 수행, 이미 PROCESSING인 경우 그냥 읽음
      if (isMainBuffer) {
        for (let i = 0; i < batchSize; i++) {
          // @ts-ignore: ioredis lmove support check
          const item = await client.lmove(UNIVERSAL_LOG_KEYS.BUFFER, UNIVERSAL_LOG_KEYS.PROCESSING, 'LEFT', 'RIGHT');
          if (!item) break;
          batchItems.push(item);
        }
      } else {
        // Recovery 모드: Processing 리스트에 있는 모든 것을 가져옴
        const items = await client.lrange(sourceKey, 0, batchSize - 1);
        if (items.length === 0) break;
        batchItems.push(...items);
      }

      if (batchItems.length === 0) break;

      this.logger.log(`[UniversalLog] 배치 처리 시작: ${batchItems.length}건 (Source: ${sourceKey})`);

      // 엔티티 복원
      const logs = batchItems.map(raw => {
        try {
          const data = JSON.parse(raw);
          return UniversalLog.rehydrate({
            id: BigInt(data.id),
            userId: data.userId ? BigInt(data.userId) : null,
            actorType: data.actorType,
            actorId: data.actorId ? BigInt(data.actorId) : null,
            service: data.service,
            event: data.event,
            targetId: data.targetId ? BigInt(data.targetId) : null,
            traceId: data.traceId,
            sessionId: data.sessionId,
            deviceId: data.deviceId,
            level: data.level,
            isSuccess: data.isSuccess,
            errorCode: data.errorCode,
            durationMs: data.durationMs,
            payload: data.payload,
            ipAddress: data.ipAddress,
            userAgentId: data.userAgentId ? BigInt(data.userAgentId) : null,
            countryCode: data.countryCode,
            requestPath: data.requestPath,
            requestMethod: data.requestMethod,
            createdAt: new Date(data.createdAt),
          });
        } catch (e) {
          this.logger.error(`로그 데이터 파싱 실패: ${raw}`, e);
          return null;
        }
      }).filter((l): l is UniversalLog => l !== null);

      if (logs.length > 0) {
        try {
          // DB Bulk Insert
          await this.logRepository.saveMany(logs);
          
          // 성공 시 처리 리스트 삭제 (Reliable Queue 완료)
          await client.del(UNIVERSAL_LOG_KEYS.PROCESSING);
          
          this.logger.log(`[UniversalLog] 배치 저장 완료: ${logs.length}건`);
        } catch (error) {
          this.logger.error(`[UniversalLog] DB 배치 저장 실패. ${logs.length}건 데이터는 Processing 리스트에 유지됨`, error);
          throw error; // BullMQ 재시도 유도
        }
      }

      // 배치 사이즈보다 적게 가져왔으면 더 이상 데이터 없음
      if (batchItems.length < batchSize) break;
    }
  }
}
