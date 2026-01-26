import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ClsService } from 'nestjs-cls';
import { Logger, OnApplicationShutdown } from '@nestjs/common';
import { CasinoQueueNames, GamePostProcessData } from '../casino-queue.types';
import { CasinoGamePostProcessService } from 'src/modules/casino/application/casino-game-post-process.service';

/**
 * 게임 후처리 큐 정책
 */
export const GamePostProcessPolicy = {
  attempts: 999999, // 무거운 작업이므로 성공할 때까지 무제한 시도
  delay: 5000,
  backoff: {
    type: 'fixed' as const,
    delay: 5000,
  },
};

@Processor(CasinoQueueNames.GAME_POST_PROCESS)
export class GamePostProcessProcessor
  extends WorkerHost
  implements OnApplicationShutdown {
  private readonly logger = new Logger(GamePostProcessProcessor.name);

  constructor(
    private readonly cls: ClsService,
    private readonly gamePostProcessService: CasinoGamePostProcessService,
  ) {
    super();
  }

  async process(job: Job<GamePostProcessData>) {
    return this.cls.run(() => this.processJob(job));
  }

  private async processJob(job: Job<GamePostProcessData>) {
    const { gameRoundId } = job.data;

    try {
      await this.gamePostProcessService.execute(BigInt(gameRoundId));

      return {
        success: true,
        message: '게임 후처리 완료',
      };
    } catch (error) {
      this.logger.error(`게임 후처리 실패: gameRoundId=${gameRoundId}`, error.stack);
      throw error;
    }
  }

  async onApplicationShutdown(signal?: string) {
    try {
      if (!this.worker) {
        return;
      }
      await this.worker.close();
      this.logger.log(
        'GamePostProcessProcessor가 정상적으로 종료되었습니다.',
      );
    } catch (error) {
      this.logger.error(
        'GamePostProcessProcessor 종료 중 오류 발생',
        error,
      );
    }
  }
}
