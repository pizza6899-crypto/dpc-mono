// src/modules/exchange/schedulers/exchange-rate-update.scheduler.ts
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClsService } from 'nestjs-cls';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import {
  ExchangeCurrencyCode,
  ExchangeRateProvider,
  Prisma,
} from '@prisma/client';
import { EnvService } from 'src/common/env/env.service';
import { nowUtc } from 'src/utils/date.util';
import { OpenExchangeRatesApiService } from '../infrastructure/open-exchange-rates-api.service';
import { ExchangeRateValidator } from '../application/exchange-rate-validator.service';
import { ConcurrencyService } from 'src/common/concurrency/concurrency.service';
import { ExchangeRateService } from '../application/exchange-rate.service';

@Injectable()
export class ExchangeRateUpdateScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(ExchangeRateUpdateScheduler.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly envService: EnvService,
    private readonly concurrencyService: ConcurrencyService,
    private readonly openExchangeRatesApiService: OpenExchangeRatesApiService,
    private readonly exchangeRateValidator: ExchangeRateValidator,
    private readonly exchangeRateService: ExchangeRateService,
    private readonly cls: ClsService,
  ) { }

  /**
   * 애플리케이션 부팅 완료 후 환율 데이터가 없으면 즉시 업데이트
   */
  async onApplicationBootstrap() {
    await this.cls.run(async () => {
      try {
        // 스케줄러가 비활성화된 경우 실행하지 않음
        if (!this.envService.scheduler.enabled) {
          this.logger.debug('스케줄러가 비활성화되어 있습니다.');
          return;
        }

        if (!this.envService.scheduler.exchangeRateUpdateEnabled) {
          this.logger.debug('환율 갱신 스케줄러가 비활성화되어 있습니다.');
          return;
        }


        // DB에 환율 데이터가 있는지 확인
        const count = await this.prismaService.exchangeRate.count({
          where: {
            provider: ExchangeRateProvider.OPEN_EXCHANGE_RATES,
            isValid: true,
          },
        });

        if (count === 0) {
          this.logger.log(
            '환율 데이터가 없습니다. 초기 환율 데이터를 가져옵니다...',
          );
          await this.updateFiatExchangeRates();
        } else {
          this.logger.log(`환율 데이터 ${count}개가 이미 존재합니다.`);
        }
      } catch (error) {
        this.logger.error(
          `초기 환율 데이터 로드 중 오류 발생: [${(error as any)?.code || 'N/A'}] ${error instanceof Error ? error.message : String(error)
          }`,
          error instanceof Error ? error.stack : undefined,
        );
        // 초기화 실패해도 앱은 계속 실행되도록 에러만 로깅
      }
    });
  }

  /**
   * 매 시간마다 피아트 환율 갱신
   */
  @Cron(CronExpression.EVERY_HOUR)
  async updateFiatExchangeRates() {
    await this.cls.run(async () => {
      // 스케줄러가 비활성화된 경우 실행하지 않음
      if (!this.envService.scheduler.enabled) {
        return;
      }

      // 환율 갱신 스케줄러가 비활성화된 경우 실행하지 않음
      if (!this.envService.scheduler.exchangeRateUpdateEnabled) {
        return;
      }

      // 다중 인스턴스에서 중복 실행 방지용 글로벌 락
      await this.concurrencyService.runExclusive(
        'exchange-rate-update-scheduler',
        async () => {
          // Open Exchange Rates에서 최신 환율 조회
          const latestRates =
            await this.openExchangeRatesApiService.getLatestRates();

          const targetCurrencies = Object.values(ExchangeCurrencyCode);
          const now = nowUtc();
          let successCount = 0;

          for (const currency of targetCurrencies) {
            try {
              // USD는 건너뛰기 (USD → USD는 항상 1)
              // 비트코인도 건너뛰기
              if (
                currency === ExchangeCurrencyCode.USD ||
                currency === ExchangeCurrencyCode.BTC
              ) {
                continue;
              }

              // Open Exchange Rates 응답에 해당 통화가 없으면 건너뛰기
              if (!(currency in latestRates.rates)) {
                continue;
              }

              // USD → currency 환율 (Open Exchange Rates는 이미 USD 기준)
              const rate = latestRates.rates[currency];

              if (!rate || rate <= 0) {
                continue;
              }

              // 이전 환율 조회 (검증용)
              const previousRate = await this.prismaService.exchangeRate.findUnique(
                {
                  where: {
                    baseCurrency_quoteCurrency_provider: {
                      baseCurrency: ExchangeCurrencyCode.USD,
                      quoteCurrency: currency,
                      provider: ExchangeRateProvider.OPEN_EXCHANGE_RATES,
                    },
                  },
                  select: { rate: true },
                },
              );

              // 환율 검증
              const validation = this.exchangeRateValidator.validate(
                new Prisma.Decimal(rate),
                previousRate?.rate,
                ExchangeCurrencyCode.USD,
                currency,
              );

              // DB에 저장 또는 업데이트
              await this.prismaService.exchangeRate.upsert({
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
              this.logger.debug(`환율 저장 실패: USD → ${currency}`, error);
            }
          }

          await this.exchangeRateService.clearAllCache();
        },
        {
          timeoutSeconds: 300,
        },
      );
    });
  }
}
