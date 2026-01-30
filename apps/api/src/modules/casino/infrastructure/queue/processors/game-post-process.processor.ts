import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ClsService } from 'nestjs-cls';
import { Logger } from '@nestjs/common';
import { GamePostProcessData } from '../casino-queue.types';
import { CasinoGamePostProcessService } from 'src/modules/casino/application/casino-game-post-process.service';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import { getQueueConfig } from 'src/infrastructure/bullmq/bullmq.constants';

const queueConfig = getQueueConfig('CASINO', 'GAME_POST_PROCESS');

@Processor(queueConfig.processorOptions, queueConfig.workerOptions)
export class GamePostProcessProcessor extends BaseProcessor<GamePostProcessData, { success: boolean; message: string }> {
  protected readonly logger = new Logger(GamePostProcessProcessor.name);

  constructor(
    protected readonly cls: ClsService,
    private readonly gamePostProcessService: CasinoGamePostProcessService,
  ) {
    super();
  }

  protected async processJob(job: Job<GamePostProcessData>): Promise<{ success: boolean; message: string }> {
    const { gameRoundId } = job.data;

    await this.gamePostProcessService.execute(BigInt(gameRoundId));

    return {
      success: true,
      message: '게임 후처리 완료',
    };
  }
}
