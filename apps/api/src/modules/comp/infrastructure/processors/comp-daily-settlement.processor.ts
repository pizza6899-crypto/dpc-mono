import { Processor, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import { ExchangeCurrencyCode, Prisma } from '@prisma/client';
import {
    BULLMQ_QUEUES,
    getQueueConfig,
} from 'src/infrastructure/bullmq/bullmq.constants';
import { SettleDailyCompService } from '../../application/settle-daily-comp.service';

const queueConfig = getQueueConfig(BULLMQ_QUEUES.COMP.DAILY_SETTLEMENT);

export interface UserSettlementData {
    userId: string;
    currency: ExchangeCurrencyCode;
    untilDate: string;
}

@Processor(queueConfig.processorOptions, queueConfig.workerOptions)
export class CompDailySettlementProcessor extends BaseProcessor<UserSettlementData | any, void> {
    protected readonly logger = new Logger(CompDailySettlementProcessor.name);

    constructor(
        private readonly settleDailyCompService: SettleDailyCompService,
        @InjectQueue(queueConfig.name) private readonly compQueue: Queue,
        protected readonly cls: ClsService,
    ) {
        super();
    }

    protected async processJob(job: Job<UserSettlementData | any>): Promise<void> {
        const { name } = job;

        if (name === queueConfig.repeatableJobs?.[0]?.name) {
            await this.handleDispatcherJob();
        } else if (name === 'comp-user-settlement') {
            await this.handleUserSettlementJob(job as Job<UserSettlementData>);
        }
    }

    private async handleDispatcherJob(): Promise<void> {
        this.logger.log('Starting daily comp settlement dispatcher job...');

        const untilDate = new Date();
        untilDate.setUTCHours(0, 0, 0, 0); // Exclude today, only resolve past un-settled days

        const pendingList = await this.settleDailyCompService.getPendingSettlements(untilDate);

        if (!pendingList.length) {
            this.logger.log('No pending comp settlements found.');
            return;
        }

        this.logger.log(`Found ${pendingList.length} pending comp settlements to dispatch.`);

        const dateStr = new Date().toISOString().split('T')[0];

        for (const pending of pendingList) {
            const data: UserSettlementData = {
                userId: pending.userId.toString(),
                currency: pending.currency,
                untilDate: untilDate.toISOString(),
            };

            await this.compQueue.add(
                'comp-user-settlement',
                data,
                {
                    jobId: `comp-user-settlement:${pending.userId}:${pending.currency}:${dateStr}`,
                    removeOnComplete: true,
                    removeOnFail: false,
                    attempts: 3,
                },
            );
        }

        this.logger.log(`Dispatched ${pendingList.length} user settlement jobs.`);
    }

    private async handleUserSettlementJob(job: Job<UserSettlementData>): Promise<void> {
        const { userId, currency, untilDate } = job.data;

        await this.settleDailyCompService.processSingleSettlement({
            userId: BigInt(userId),
            currency,
        }, new Date(untilDate));
    }
}
