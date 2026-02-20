// apps/api/src/modules/exchange/infrastructure/processors/exchange-rate-update.processor.ts

import { Processor } from '@nestjs/bullmq';
import { Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Job } from 'bullmq';
import { ClsService } from 'nestjs-cls';
import {
  ExchangeCurrencyCode,
  ExchangeRateProvider,
  Prisma,
} from '@prisma/client';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { nowUtc } from 'src/utils/date.util';
import { OpenExchangeRatesApiService } from '../open-exchange-rates-api.service';
import { ExchangeRateValidator } from '../../application/exchange-rate-validator.service';
import { ExchangeRateService } from '../../application/exchange-rate.service';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import {
  BULLMQ_QUEUES,
  getQueueConfig,
} from 'src/infrastructure/bullmq/bullmq.constants';

const queueConfig = getQueueConfig(BULLMQ_QUEUES.EXCHANGE.RATE_SYNC);

@Processor(queueConfig.processorOptions, queueConfig.workerOptions)
export class ExchangeRateUpdateProcessor
  extends BaseProcessor<any, void>
  implements OnApplicationBootstrap
{
  protected readonly logger = new Logger(ExchangeRateUpdateProcessor.name);

  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly openExchangeRatesApiService: OpenExchangeRatesApiService,
    private readonly exchangeRateValidator: ExchangeRateValidator,
    private readonly exchangeRateService: ExchangeRateService,
    protected readonly cls: ClsService,
  ) {
    super();
  }

  async onApplicationBootstrap() {
    await this.cls.run(async () => {
      // 초기 데이터가 없는 경우 즉시 업데이트 시도
      const count = await this.tx.exchangeRate.count({
        where: {
          provider: ExchangeRateProvider.OPEN_EXCHANGE_RATES,
          isValid: true,
        },
      });

      if (count === 0) {
        this.logger.log(
          'No exchange rate data found. Performing initial sync...',
        );
        await this.updateFiatExchangeRates();
      }
    });
  }

  protected async processJob(job: Job<any>): Promise<void> {
    const { name } = job;

    if (name === BULLMQ_QUEUES.EXCHANGE.RATE_SYNC.repeatableJobs[0].name) {
      await this.updateFiatExchangeRates();
    }
  }

  private async updateFiatExchangeRates() {
    this.logger.log('Starting fiat exchange rates update...');

    // Open Exchange Rates에서 최신 환율 조회
    const latestRates = await this.openExchangeRatesApiService.getLatestRates();
    const targetCurrencies = Object.values(ExchangeCurrencyCode);
    const now = nowUtc();
    let successCount = 0;

    for (const currency of targetCurrencies) {
      try {
        if (
          currency === ExchangeCurrencyCode.USD ||
          currency === ExchangeCurrencyCode.BTC
        ) {
          continue;
        }

        if (!(currency in latestRates.rates)) {
          continue;
        }

        const rate = latestRates.rates[currency];
        if (!rate || rate <= 0) continue;

        const previousRate = await this.tx.exchangeRate.findUnique({
          where: {
            baseCurrency_quoteCurrency_provider: {
              baseCurrency: ExchangeCurrencyCode.USD,
              quoteCurrency: currency,
              provider: ExchangeRateProvider.OPEN_EXCHANGE_RATES,
            },
          },
          select: { rate: true },
        });

        const validation = this.exchangeRateValidator.validate(
          new Prisma.Decimal(rate),
          previousRate?.rate,
          ExchangeCurrencyCode.USD,
          currency,
        );

        await this.tx.exchangeRate.upsert({
          where: {
            baseCurrency_quoteCurrency_provider: {
              baseCurrency: ExchangeCurrencyCode.USD,
              quoteCurrency: currency,
              provider: ExchangeRateProvider.OPEN_EXCHANGE_RATES,
            },
          },
          update: {
            rate: rate,
            collectedAt: now,
            previousRate: previousRate?.rate || null,
            changeRate: validation.changeRate || null,
            isValid: validation.isValid,
            updatedAt: now,
          },
          create: {
            baseCurrency: ExchangeCurrencyCode.USD,
            quoteCurrency: currency,
            rate: rate,
            provider: ExchangeRateProvider.OPEN_EXCHANGE_RATES,
            collectedAt: now,
            previousRate: previousRate?.rate || null,
            changeRate: validation.changeRate || null,
            isValid: validation.isValid,
            updatedAt: now,
          },
        });

        successCount++;
      } catch (error) {
        this.logger.debug(
          `Failed to save exchange rate: USD -> ${currency}`,
          error,
        );
      }
    }

    await this.exchangeRateService.clearAllCache();
    this.logger.log(
      `Exchange rate update completed. Success count: ${successCount}`,
    );
  }
}
