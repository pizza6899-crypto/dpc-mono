import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ExchangeCurrencyCode, Prisma } from '@repo/database';
import { ANALYTICS_QUEUE_NAME, AnalyticsJobName } from '../consumers/analytics.consumer';

interface EnqueueDepositParams {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    amount: Prisma.Decimal;
    date?: Date;
}

interface EnqueueWithdrawParams {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    amount: Prisma.Decimal;
    date?: Date;
}

interface EnqueueGameParams {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    betAmount: Prisma.Decimal;
    winAmount: Prisma.Decimal;
    category: 'slot' | 'live' | 'other';
    date?: Date;
}

interface EnqueueBonusParams {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    givenAmount?: Prisma.Decimal;
    usedAmount?: Prisma.Decimal;
    convertedAmount?: Prisma.Decimal;
    date?: Date;
}

interface EnqueueCompParams {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    earnedAmount?: Prisma.Decimal;
    convertedAmount?: Prisma.Decimal;
    date?: Date;
}

@Injectable()
export class AnalyticsQueueService {
    private readonly logger = new Logger(AnalyticsQueueService.name);

    constructor(
        @InjectQueue(ANALYTICS_QUEUE_NAME)
        private readonly queue: Queue,
    ) { }

    async enqueueDeposit(params: EnqueueDepositParams): Promise<void> {
        await this.addJob(AnalyticsJobName.RECORD_DEPOSIT, {
            userId: params.userId.toString(),
            currency: params.currency,
            amount: params.amount.toString(),
            date: (params.date || new Date()).toISOString(),
        });
    }

    async enqueueWithdraw(params: EnqueueWithdrawParams): Promise<void> {
        await this.addJob(AnalyticsJobName.RECORD_WITHDRAW, {
            userId: params.userId.toString(),
            currency: params.currency,
            amount: params.amount.toString(),
            date: (params.date || new Date()).toISOString(),
        });
    }

    async enqueueGame(params: EnqueueGameParams): Promise<void> {
        await this.addJob(AnalyticsJobName.RECORD_GAME, {
            userId: params.userId.toString(),
            currency: params.currency,
            betAmount: params.betAmount.toString(),
            winAmount: params.winAmount.toString(),
            category: params.category,
            date: (params.date || new Date()).toISOString(),
        });
    }

    async enqueueBonus(params: EnqueueBonusParams): Promise<void> {
        await this.addJob(AnalyticsJobName.RECORD_BONUS, {
            userId: params.userId.toString(),
            currency: params.currency,
            givenAmount: params.givenAmount?.toString(),
            usedAmount: params.usedAmount?.toString(),
            convertedAmount: params.convertedAmount?.toString(),
            date: (params.date || new Date()).toISOString(),
        });
    }

    async enqueueComp(params: EnqueueCompParams): Promise<void> {
        await this.addJob(AnalyticsJobName.RECORD_COMP, {
            userId: params.userId.toString(),
            currency: params.currency,
            earnedAmount: params.earnedAmount?.toString(),
            convertedAmount: params.convertedAmount?.toString(),
            date: (params.date || new Date()).toISOString(),
        });
    }

    private async addJob(name: string, data: any): Promise<void> {
        try {
            await this.queue.add(name, data, {
                removeOnComplete: true,
                attempts: 5,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
            });
        } catch (error) {
            this.logger.error(
                `Failed to enqueue analytics job: ${name}`,
                error instanceof Error ? error.stack : String(error),
            );
            // We don't throw here to avoid failing the main transaction for analytics
            // in some projects, but it's a trade-off.
        }
    }
}
