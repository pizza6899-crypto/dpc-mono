// src/modules/exchange/application/exchange-rate.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/platform/prisma/prisma.service';
import { RedisService } from 'src/platform/redis/redis.service';
import {
  ExchangeCurrencyCode,
  ExchangeRateProvider,
  Prisma,
} from '@repo/database';
import { ApiException } from 'src/platform/http/exception/api.exception';
import { MessageCode } from 'src/platform/http/types';
import { ExchangeRateService } from '../application/exchange-rate.service';

describe('ExchangeRateService', () => {
  let service: ExchangeRateService;
  let mockPrisma: jest.Mocked<PrismaService>;
  let mockRedis: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const mockPrismaProvider = {
      provide: PrismaService,
      useValue: {
        exchangeRate: {
          findUnique: jest.fn(),
        },
      },
    };

    const mockRedisProvider = {
      provide: RedisService,
      useValue: {
        get: jest.fn(),
        set: jest.fn(),
        keys: jest.fn(),
        del: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ExchangeRateService, mockPrismaProvider, mockRedisProvider],
    }).compile();

    service = module.get<ExchangeRateService>(ExchangeRateService);
    mockPrisma = module.get(PrismaService);
    mockRedis = module.get(RedisService);

    jest.clearAllMocks();
  });

  describe('getRate', () => {
    it('같은 통화일 경우 1을 반환해야 함', async () => {
      const result = await service.getRate({
        fromCurrency: ExchangeCurrencyCode.USD,
        toCurrency: ExchangeCurrencyCode.USD,
      });

      expect(result).toEqual(new Prisma.Decimal(1));
      expect(mockRedis.get).not.toHaveBeenCalled();
      expect(mockPrisma.exchangeRate.findUnique).not.toHaveBeenCalled();
    });

    it('USD -> KRW 환율을 조회할 수 있어야 함', async () => {
      const mockRate = new Prisma.Decimal('1300');
      const mockRecord = {
        isValid: true,
        rate: mockRate,
      };

      (mockRedis.get as jest.Mock).mockResolvedValue(null);
      (mockPrisma.exchangeRate.findUnique as jest.Mock).mockResolvedValue(
        mockRecord,
      );
      (mockRedis.set as jest.Mock).mockResolvedValue(undefined);

      const result = await service.getRate({
        fromCurrency: ExchangeCurrencyCode.USD,
        toCurrency: ExchangeCurrencyCode.KRW,
      });

      expect(result).toEqual(mockRate);
      expect(mockPrisma.exchangeRate.findUnique).toHaveBeenCalledWith({
        where: {
          baseCurrency_quoteCurrency_provider: {
            baseCurrency: ExchangeCurrencyCode.USD,
            quoteCurrency: ExchangeCurrencyCode.KRW,
            provider: ExchangeRateProvider.OPEN_EXCHANGE_RATES,
          },
        },
        select: {
          isValid: true,
          rate: true,
        },
      });
      expect(mockRedis.set).toHaveBeenCalledWith(
        'exchange-rate:OPEN_EXCHANGE_RATES:USD:KRW',
        '1300',
        21600,
      );
    });

    it('캐시에서 환율을 조회할 수 있어야 함', async () => {
      const cachedRate = '1300';
      (mockRedis.get as jest.Mock).mockResolvedValue(cachedRate);

      const result = await service.getRate({
        fromCurrency: ExchangeCurrencyCode.USD,
        toCurrency: ExchangeCurrencyCode.KRW,
      });

      expect(result).toEqual(new Prisma.Decimal(cachedRate));
      expect(mockPrisma.exchangeRate.findUnique).not.toHaveBeenCalled();
    });

    it('KRW -> USD 환율을 조회할 수 있어야 함 (역수)', async () => {
      const usdToKrw = new Prisma.Decimal('1300');
      const mockRecord = {
        isValid: true,
        rate: usdToKrw,
      };

      (mockRedis.get as jest.Mock).mockResolvedValue(null);
      (mockPrisma.exchangeRate.findUnique as jest.Mock).mockResolvedValue(
        mockRecord,
      );
      (mockRedis.set as jest.Mock).mockResolvedValue(undefined);

      const result = await service.getRate({
        fromCurrency: ExchangeCurrencyCode.KRW,
        toCurrency: ExchangeCurrencyCode.USD,
      });

      const expectedRate = new Prisma.Decimal(1).div(usdToKrw);
      expect(result).toEqual(expectedRate);
    });

    it('KRW -> JPY 환율을 조회할 수 있어야 함 (교차 환율)', async () => {
      const usdToKrw = new Prisma.Decimal('1300');
      const usdToJpy = new Prisma.Decimal('150');

      (mockRedis.get as jest.Mock)
        .mockResolvedValueOnce(null) // KRW 조회
        .mockResolvedValueOnce(null); // JPY 조회

      (mockPrisma.exchangeRate.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          isValid: true,
          rate: usdToKrw,
        })
        .mockResolvedValueOnce({
          isValid: true,
          rate: usdToJpy,
        });

      (mockRedis.set as jest.Mock).mockResolvedValue(undefined);

      const result = await service.getRate({
        fromCurrency: ExchangeCurrencyCode.KRW,
        toCurrency: ExchangeCurrencyCode.JPY,
      });

      const expectedRate = usdToJpy.div(usdToKrw);
      expect(result).toEqual(expectedRate);
    });

    it('환율 데이터가 없으면 예외를 발생시켜야 함', async () => {
      (mockRedis.get as jest.Mock).mockResolvedValue(null);
      (mockPrisma.exchangeRate.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.getRate({
          fromCurrency: ExchangeCurrencyCode.USD,
          toCurrency: ExchangeCurrencyCode.KRW,
        }),
      ).rejects.toThrow(ApiException);

      await expect(
        service.getRate({
          fromCurrency: ExchangeCurrencyCode.USD,
          toCurrency: ExchangeCurrencyCode.KRW,
        }),
      ).rejects.toThrow('Exchange rate not found');
    });

    it('유효하지 않은 환율 데이터면 예외를 발생시켜야 함', async () => {
      const mockRecord = {
        isValid: false,
        rate: new Prisma.Decimal('1300'),
      };

      (mockRedis.get as jest.Mock).mockResolvedValue(null);
      (mockPrisma.exchangeRate.findUnique as jest.Mock).mockResolvedValue(
        mockRecord,
      );

      await expect(
        service.getRate({
          fromCurrency: ExchangeCurrencyCode.USD,
          toCurrency: ExchangeCurrencyCode.KRW,
        }),
      ).rejects.toThrow(ApiException);

      await expect(
        service.getRate({
          fromCurrency: ExchangeCurrencyCode.USD,
          toCurrency: ExchangeCurrencyCode.KRW,
        }),
      ).rejects.toThrow('Invalid exchange rate');
    });

    it('커스텀 provider를 사용할 수 있어야 함', async () => {
      const mockRate = new Prisma.Decimal('1300');
      const mockRecord = {
        isValid: true,
        rate: mockRate,
      };

      (mockRedis.get as jest.Mock).mockResolvedValue(null);
      (mockPrisma.exchangeRate.findUnique as jest.Mock).mockResolvedValue(
        mockRecord,
      );
      (mockRedis.set as jest.Mock).mockResolvedValue(undefined);

      await service.getRate({
        fromCurrency: ExchangeCurrencyCode.USD,
        toCurrency: ExchangeCurrencyCode.KRW,
        provider: ExchangeRateProvider.OPEN_EXCHANGE_RATES,
      });

      expect(mockPrisma.exchangeRate.findUnique).toHaveBeenCalledWith({
        where: {
          baseCurrency_quoteCurrency_provider: {
            baseCurrency: ExchangeCurrencyCode.USD,
            quoteCurrency: ExchangeCurrencyCode.KRW,
            provider: ExchangeRateProvider.OPEN_EXCHANGE_RATES,
          },
        },
        select: {
          isValid: true,
          rate: true,
        },
      });
    });
  });

  describe('clearAllCache', () => {
    it('모든 환율 캐시를 삭제해야 함', async () => {
      const mockKeys = [
        'exchange-rate:OPEN_EXCHANGE_RATES:USD:KRW',
        'exchange-rate:OPEN_EXCHANGE_RATES:USD:JPY',
      ];

      (mockRedis.keys as jest.Mock).mockResolvedValue(mockKeys);
      (mockRedis.del as jest.Mock).mockResolvedValue(1);

      await service.clearAllCache();

      expect(mockRedis.keys).toHaveBeenCalledWith('exchange-rate:*');
      expect(mockRedis.del).toHaveBeenCalledTimes(2);
      expect(mockRedis.del).toHaveBeenCalledWith(mockKeys[0]);
      expect(mockRedis.del).toHaveBeenCalledWith(mockKeys[1]);
    });

    it('캐시가 없으면 아무것도 삭제하지 않아야 함', async () => {
      (mockRedis.keys as jest.Mock).mockResolvedValue([]);

      await service.clearAllCache();

      expect(mockRedis.keys).toHaveBeenCalledWith('exchange-rate:*');
      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });
});
