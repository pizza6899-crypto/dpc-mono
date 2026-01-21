import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import {
  ExchangeCurrencyCode,
  ExchangeRateProvider,
  Prisma,
} from '@prisma/client';
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from 'src/common/http/types';
import { RedisService } from 'src/infrastructure/redis/redis.service';

export interface ConvertCurrencyParams {
  amount: Prisma.Decimal | number | string;
  fromCurrency: ExchangeCurrencyCode;
  toCurrency: ExchangeCurrencyCode;
  provider?: ExchangeRateProvider;
}

export interface ConvertCurrencyResult {
  rate: Prisma.Decimal; // fromCurrency -> toCurrency 환율
  convertedAmount: Prisma.Decimal; // 변환된 금액
}

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);

  private readonly defaultProvider = ExchangeRateProvider.OPEN_EXCHANGE_RATES;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  private getCacheKey(
    provider: ExchangeRateProvider,
    quoteCurrency: ExchangeCurrencyCode,
  ): string {
    return `exchange-rate:${provider}:USD:${quoteCurrency}`;
  }

  async clearAllCache(): Promise<void> {
    const pattern = 'exchange-rate:*';
    const keys = await this.redisService.keys(pattern);
    if (!keys.length) return;

    for (const key of keys) {
      await this.redisService.del(key);
    }

    this.logger.log(`환율 캐시 삭제: ${keys.length}개 키`);
  }

  /**
   * 단순 환율 조회 (fromCurrency -> toCurrency)
   */
  async getRate(params: {
    fromCurrency: ExchangeCurrencyCode;
    toCurrency: ExchangeCurrencyCode;
    provider?: ExchangeRateProvider;
  }): Promise<Prisma.Decimal> {
    const { fromCurrency, toCurrency } = params;
    const provider = params.provider ?? this.defaultProvider;

    if (fromCurrency === toCurrency) {
      return new Prisma.Decimal(1);
    }

    return this.getRateBetweenCurrencies({
      fromCurrency,
      toCurrency,
      provider,
    });
  }

  /**
   * USD 기준 환율 테이블을 이용해서
   * fromCurrency -> toCurrency 환율 계산
   *
   * - 우리가 가진 데이터: USD -> X (quoteCurrency=X)
   * - 원하는 것:
   *   - USD -> X : 그대로 사용
   *   - X -> USD : (USD -> X) 의 역수
   *   - A -> B   : (USD -> B) / (USD -> A)
   */
  private async getRateBetweenCurrencies(params: {
    fromCurrency: ExchangeCurrencyCode;
    toCurrency: ExchangeCurrencyCode;
    provider: ExchangeRateProvider;
  }): Promise<Prisma.Decimal> {
    const { fromCurrency, toCurrency, provider } = params;

    // 1. USD -> X
    if (fromCurrency === ExchangeCurrencyCode.USD) {
      return await this.getUsdBaseRate(toCurrency, provider);
    }

    // 2. X -> USD  (USD -> X 환율의 역수)
    if (toCurrency === ExchangeCurrencyCode.USD) {
      const usdToFrom = await this.getUsdBaseRate(fromCurrency, provider);
      return new Prisma.Decimal(1).div(usdToFrom);
    }

    // 3. A -> B = (USD -> B) / (USD -> A)
    const usdToFrom = await this.getUsdBaseRate(fromCurrency, provider);
    const usdToTo = await this.getUsdBaseRate(toCurrency, provider);

    return usdToTo.div(usdToFrom);
  }

  /**
   * USD -> quoteCurrency 환율을 ExchangeRate 테이블에서 조회
   * - isValid=false 인 데이터는 사용하지 않음
   */
  private async getUsdBaseRate(
    quoteCurrency: ExchangeCurrencyCode,
    provider: ExchangeRateProvider,
  ): Promise<Prisma.Decimal> {
    const cacheKey = this.getCacheKey(provider, quoteCurrency);

    // 1. 캐시 조회
    const cached = await this.redisService.get<string>(cacheKey);
    if (cached) {
      return new Prisma.Decimal(cached);
    }

    // scheduler 에서 upsert 로 unique key 에 맞게 1 row 만 유지하므로 findUnique 사용
    const record = await this.prismaService.exchangeRate.findUnique({
      where: {
        baseCurrency_quoteCurrency_provider: {
          baseCurrency: ExchangeCurrencyCode.USD,
          quoteCurrency,
          provider,
        },
      },
      select: {
        isValid: true,
        rate: true,
      },
    });

    if (!record) {
      throw new ApiException(
        MessageCode.INTERNAL_SERVER_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
        `Exchange rate not found: USD -> ${quoteCurrency} (${provider})`,
      );
    }

    if (!record.isValid) {
      throw new ApiException(
        MessageCode.INTERNAL_SERVER_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
        `Invalid exchange rate: USD -> ${quoteCurrency} (${provider})`,
      );
    }

    // 변경 (6시간)
    await this.redisService.set(cacheKey, record.rate.toString(), 21600);

    return record.rate;
  }
}
