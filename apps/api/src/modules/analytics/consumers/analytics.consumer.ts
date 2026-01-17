import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, OnApplicationShutdown } from '@nestjs/common';
import { RecordUserActivityService } from '../application/record-user-activity.service';
import { ExchangeCurrencyCode, Prisma } from 'src/generated/prisma';

export const ANALYTICS_QUEUE_NAME = 'analytics';

export enum AnalyticsJobName {
    RECORD_DEPOSIT = 'analytics.record.deposit',
    RECORD_WITHDRAW = 'analytics.record.withdraw',
    RECORD_GAME = 'analytics.record.game',
    RECORD_BONUS = 'analytics.record.bonus',
    RECORD_COMP = 'analytics.record.comp',
}

interface AnalyticsJobPayload {
    userId: string; // BigInt serialized as string in JSON
    currency: ExchangeCurrencyCode;
    date: string; // ISO string
    [key: string]: any;
}

@Processor(ANALYTICS_QUEUE_NAME)
export class AnalyticsConsumer extends WorkerHost implements OnApplicationShutdown {
    private readonly logger = new Logger(AnalyticsConsumer.name);

    constructor(
        private readonly recordService: RecordUserActivityService,
    ) {
        super();
    }

    async process(job: Job<AnalyticsJobPayload>): Promise<void> {
        const { name, data } = job;
        this.logger.log(`Processing analytics job: ${name} ${job.id}`);

        try {
            const userId = BigInt(data.userId);
            const date = new Date(data.date);

            switch (name) {
                case AnalyticsJobName.RECORD_DEPOSIT:
                    await this.recordService.recordDeposit({
                        userId,
                        currency: data.currency,
                        date,
                        amount: data.amount ? new Prisma.Decimal(data.amount) : new Prisma.Decimal(0),
                    });
                    break;

                case AnalyticsJobName.RECORD_WITHDRAW:
                    await this.recordService.recordWithdraw({
                        userId,
                        currency: data.currency,
                        date,
                        amount: data.amount ? new Prisma.Decimal(data.amount) : new Prisma.Decimal(0),
                    });
                    break;

                case AnalyticsJobName.RECORD_GAME:
                    await this.recordService.recordGame({
                        userId,
                        currency: data.currency,
                        date,
                        betAmount: data.betAmount ? new Prisma.Decimal(data.betAmount) : new Prisma.Decimal(0),
                        winAmount: data.winAmount ? new Prisma.Decimal(data.winAmount) : new Prisma.Decimal(0),
                        category: data.category,
                    });
                    break;

                case AnalyticsJobName.RECORD_BONUS:
                    await this.recordService.recordBonus({
                        userId,
                        currency: data.currency,
                        date,
                        givenAmount: data.givenAmount ? new Prisma.Decimal(data.givenAmount) : undefined,
                        usedAmount: data.usedAmount ? new Prisma.Decimal(data.usedAmount) : undefined,
                        convertedAmount: data.convertedAmount ? new Prisma.Decimal(data.convertedAmount) : undefined,
                    });
                    break;

                case AnalyticsJobName.RECORD_COMP:
                    await this.recordService.recordComp({
                        userId,
                        currency: data.currency,
                        date,
                        earnedAmount: data.earnedAmount ? new Prisma.Decimal(data.earnedAmount) : undefined,
                        convertedAmount: data.convertedAmount ? new Prisma.Decimal(data.convertedAmount) : undefined,
                        deductedAmount: data.deductedAmount ? new Prisma.Decimal(data.deductedAmount) : undefined,
                    });
                    break;

                default:
                    this.logger.warn(`Unknown job name: ${name}`);
            }
        } catch (error) {
            this.logger.error(
                `Failed to process analytics job ${name} ${job.id}`,
                error instanceof Error ? error.stack : String(error),
            );
            throw error;
        }
    }

    async onApplicationShutdown(signal?: string): Promise<void> {
        try {
            const worker = this.worker;
            if (worker) {
                await worker.close();
            }
        } catch (error) {
            // Ignore errors during shutdown
        }
    }
}
