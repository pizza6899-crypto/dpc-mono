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

        // Apply UTC+9 (JST/KST) offset to align the daily bucket strictly to 00:00 KST
        const now = new Date();
        const kstOffsetMs = 9 * 60 * 60 * 1000;
        const untilDate = new Date(now.getTime() + kstOffsetMs);
        untilDate.setUTCHours(0, 0, 0, 0); // Exclude today (KST), only resolve past un-settled days

        const dateStr = new Date().toISOString().split('T')[0];
        let totalDispatched = 0;

        await this.settleDailyCompService.processPendingSettlementsBatch(
            untilDate,
            1000, // Process 1000 users per DB query batch
            async (pendingList) => {
                const jobs = pendingList.map((pending) => ({
                    name: 'comp-user-settlement',
                    data: {
                        userId: pending.userId.toString(),
                        currency: pending.currency,
                        untilDate: untilDate.toISOString(),
                    },
                    opts: {
                        jobId: `comp-user-settlement-${pending.userId}-${pending.currency}-${dateStr}`,
                    },
                }));

                await this.compQueue.addBulk(jobs as any);
                totalDispatched += jobs.length;
                this.logger.debug(`Dispatched batch of ${jobs.length} settlements...`);
            }
        );

        this.logger.log(`Dispatched total of ${totalDispatched} user settlement jobs.`);
    }

    private async handleUserSettlementJob(job: Job<UserSettlementData>): Promise<void> {
        const { userId, currency, untilDate } = job.data;

        await this.settleDailyCompService.processSingleSettlement({
            userId: BigInt(userId),
            currency,
        }, new Date(untilDate));
    }
}
