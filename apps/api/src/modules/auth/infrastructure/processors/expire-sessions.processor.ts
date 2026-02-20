// apps/api/src/modules/auth/infrastructure/processors/expire-sessions.processor.ts

import { Processor } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ClsService } from 'nestjs-cls';
import { ExpireSessionsBatchService } from '../../session/application/expire-sessions-batch.service';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import {
  BULLMQ_QUEUES,
  getQueueConfig,
} from 'src/infrastructure/bullmq/bullmq.constants';

const queueConfig = getQueueConfig(BULLMQ_QUEUES.AUTH.SESSION_CLEANUP);

@Processor(queueConfig.processorOptions, queueConfig.workerOptions)
export class ExpireSessionsProcessor extends BaseProcessor<any, void> {
  protected readonly logger = new Logger(ExpireSessionsProcessor.name);

  constructor(
    private readonly expireSessionsBatchService: ExpireSessionsBatchService,
    protected readonly cls: ClsService,
  ) {
    super();
  }

  protected async processJob(job: Job<any>): Promise<void> {
    const { name } = job;

    if (name === BULLMQ_QUEUES.AUTH.SESSION_CLEANUP.repeatableJobs[0].name) {
      await this.handleExpireSessions();
    }
  }

  private async handleExpireSessions() {
    this.logger.log('Starting expired sessions batch cleanup...');

    const result = await this.expireSessionsBatchService.execute({
      batchSize: 100,
    });

    this.logger.log(
      `Expired sessions cleanup completed. Expired count: ${result.expiredCount}`,
    );
  }
}
