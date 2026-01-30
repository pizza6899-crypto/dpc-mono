// apps/api/src/modules/affiliate/infrastructure/processors/settle-daily-commissions.processor.ts

import { Processor } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SettleDailyCommissionsService } from '../../commission/application/settle-daily-commissions.service';
import { nowUtc } from 'src/utils/date.util';
import { ClsService } from 'nestjs-cls';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import { BULLMQ_QUEUES, getQueueConfig } from 'src/infrastructure/bullmq/bullmq.constants';

const queueConfig = getQueueConfig(BULLMQ_QUEUES.AFFILIATE.COMMISSION);

@Processor(queueConfig.processorOptions, queueConfig.workerOptions)
export class SettleDailyCommissionsProcessor extends BaseProcessor<any, void> {
    protected readonly logger = new Logger(SettleDailyCommissionsProcessor.name);

    constructor(
        private readonly settleDailyCommissionsService: SettleDailyCommissionsService,
        protected readonly cls: ClsService,
    ) {
        super();
    }

    protected async processJob(job: Job<any>): Promise<void> {
        const { name } = job;

        if (name === BULLMQ_QUEUES.AFFILIATE.COMMISSION.repeatableJobs![0].name) {
            await this.handleSettlement();
        }
    }

    private async handleSettlement() {
        // 전날 날짜 기준으로 정산 (UTC 기준)
        const settlementDate = new Date(nowUtc());
        settlementDate.setUTCDate(settlementDate.getUTCDate() - 1);
        settlementDate.setUTCHours(0, 0, 0, 0); // 전날 00:00:00 UTC

        this.logger.log(`Starting daily commission settlement for ${settlementDate.toISOString()}`);

        const result = await this.settleDailyCommissionsService.execute({
            settlementDate,
        });

        this.logger.log(
            `Daily commission settlement completed. Count: ${result.settledCount}, Total: ${result.totalAmount.toString()}`,
        );
    }
}
