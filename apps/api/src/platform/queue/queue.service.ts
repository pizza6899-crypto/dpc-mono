import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue, WorkerHost } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import {
  QueueNames,
  QueueJobOptions,
  WhitecliffFetchGameResultUrlData,
  GamePostProcessData,
  DcsFetchGameReplayUrlData,
} from './queue.types';
import { QUEUE_CONFIGS } from './queue.constants';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    private readonly moduleRef: ModuleRef,
    @InjectQueue(QueueNames.WHITECLIFF_FETCH_GAME_RESULT_URL)
    private whitecliffFetchGameResultUrlQueue: Queue,
    @InjectQueue(QueueNames.DCS_FETCH_GAME_REPLAY_URL)
    private dcsFetchGameReplayUrlQueue: Queue,
    @InjectQueue(QueueNames.GAME_POST_PROCESS)
    private gamePostProcessQueue: Queue,
  ) {}

  /**
   * Whitecliff 게임 종료 후 베팅 정보 URL 받아와서 처리하는 큐에 작업 추가
   */
  async addWhitecliffFetchGameResultUrlJob(
    data: WhitecliffFetchGameResultUrlData,
    options?: QueueJobOptions,
  ): Promise<Job> {
    const config = QUEUE_CONFIGS[QueueNames.WHITECLIFF_FETCH_GAME_RESULT_URL];
    const jobOptions = {
      ...config,
      ...options,
    };

    const job = await this.whitecliffFetchGameResultUrlQueue.add(
      'process-fetch-game-result-url',
      data,
      jobOptions,
    );
    this.logger.log(
      `Whitecliff fetch game result url job added: ${job.id} - process-fetch-game-result-url`,
    );
    return job;
  }

  /**
   * 게임 후처리 큐에 작업 추가
   * 콤프, 롤링, VIP 레벨 등 처리
   */
  async addGamePostProcessJob(
    data: GamePostProcessData,
    options?: QueueJobOptions,
  ): Promise<Job> {
    const config = QUEUE_CONFIGS[QueueNames.GAME_POST_PROCESS];
    const jobOptions = {
      ...config,
      ...options,
    };

    const job = await this.gamePostProcessQueue.add(
      'process-game-post',
      data,
      jobOptions,
    );
    this.logger.log(
      `Game post process job added: ${job.id} - gameRoundId=${data.gameRoundId}`,
    );
    return job;
  }

  /**
   * DCS 게임 종료 후 리플레이 URL 받아와서 처리하는 큐에 작업 추가
   */
  async addDcsFetchGameReplayUrlJob(
    data: DcsFetchGameReplayUrlData,
    options?: QueueJobOptions,
  ): Promise<Job> {
    const config = QUEUE_CONFIGS[QueueNames.DCS_FETCH_GAME_REPLAY_URL];
    const jobOptions = {
      ...config,
      ...options,
    };

    const job = await this.dcsFetchGameReplayUrlQueue.add(
      'process-fetch-game-replay-url',
      data,
      jobOptions,
    );
    this.logger.log(
      `DCS fetch game replay url job added: ${job.id} - process-fetch-game-replay-url`,
    );
    return job;
  }

  /**
   * 큐 상태 조회
   */
  async getQueueStatus(queueName: QueueNames) {
    const queue = this.getQueueByName(queueName);
    if (!queue) return null;

    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }

  /**
   * 큐 이름으로 큐 인스턴스 가져오기
   */
  private getQueueByName(queueName: QueueNames): Queue | null {
    switch (queueName) {
      case QueueNames.WHITECLIFF_FETCH_GAME_RESULT_URL:
        return this.whitecliffFetchGameResultUrlQueue;
      case QueueNames.DCS_FETCH_GAME_REPLAY_URL:
        return this.dcsFetchGameReplayUrlQueue;
      case QueueNames.GAME_POST_PROCESS:
        return this.gamePostProcessQueue;
      default:
        return null;
    }
  }
}
