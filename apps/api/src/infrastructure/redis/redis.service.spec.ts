import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { EnvService } from '../../infrastructure/env/env.service';
import Redis from 'ioredis';

// ioredis 모킹
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    on: jest.fn(),
  }));
});

describe('RedisService', () => {
  let service: RedisService;
  let redisClientMock: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: EnvService,
          useValue: {
            redis: {
              host: 'localhost',
              port: 6379,
            },
          },
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    redisClientMock = service.getClient();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Serialization (SET)', () => {
    it('should handle basic objects', async () => {
      const data = { name: 'test', count: 1 };
      redisClientMock.set.mockResolvedValue('OK');

      await service.set('key', data);

      expect(redisClientMock.set).toHaveBeenCalledWith(
        'key',
        JSON.stringify(data), // '{"name":"test","count":1}'
        'EX',
        expect.any(Number),
      );
    });

    it('should convert BigInt to string', async () => {
      const data = { id: BigInt(1234567890123456789n) };
      redisClientMock.set.mockResolvedValue('OK');

      await service.set('key', data);

      // BigInt가 문자열로 변환되었는지 검증
      const expectedJson = '{"id":"1234567890123456789"}';
      expect(redisClientMock.set).toHaveBeenCalledWith(
        'key',
        expectedJson,
        'EX',
        expect.any(Number),
      );
    });

    it('should convert Decimal-like objects to string', async () => {
      // Prisma.Decimal 유사 객체 흉내
      const decimalMock = {
        constructor: { name: 'Decimal' },
        toString: () => '123.45',
      };
      const data = { amount: decimalMock };
      redisClientMock.set.mockResolvedValue('OK');

      await service.set('key', data);

      const expectedJson = '{"amount":"123.45"}';
      expect(redisClientMock.set).toHaveBeenCalledWith(
        'key',
        expectedJson,
        'EX',
        expect.any(Number),
      );
    });
  });

  describe('Deserialization (GET)', () => {
    it('should restore Date strings to Date objects', async () => {
      const isoDate = '2025-01-01T12:00:00.000Z';
      const storedJson = JSON.stringify({
        created_at: isoDate,
        name: 'event',
      });

      redisClientMock.get.mockResolvedValue(storedJson);

      const result = await service.get<any>('key');

      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.created_at.toISOString()).toBe(isoDate);
      expect(result.name).toBe('event');
    });

    it('should return null if key does not exist', async () => {
      redisClientMock.get.mockResolvedValue(null);
      const result = await service.get('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('Deletion (DEL)', () => {
    it('should return true if key is deleted', async () => {
      redisClientMock.del.mockResolvedValue(1);
      const result = await service.del('key');
      expect(result).toBe(true);
      expect(redisClientMock.del).toHaveBeenCalledWith('key');
    });

    it('should return false if key does not exist', async () => {
      redisClientMock.del.mockResolvedValue(0);
      const result = await service.del('non-existent');
      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      redisClientMock.del.mockRejectedValue(new Error('Connection error'));
      const result = await service.del('key');
      expect(result).toBe(false);
    });
  });

  describe('Edge Cases & Complex Objects', () => {
    it('should handle deeply nested mixed types', async () => {
      const nestedData = {
        user: {
          id: BigInt(999999999999),
          balance: {
            constructor: { name: 'Decimal' },
            toString: () => '100.50',
          },
          history: [
            { date: new Date('2025-01-01T00:00:00.000Z'), value: 100 },
            { date: new Date('2025-01-02T00:00:00.000Z'), value: 200 },
          ],
        },
        meta: {
          active: true,
          tags: ['a', 'b'],
        },
      };
      redisClientMock.set.mockResolvedValue('OK');

      await service.set('complex_key', nestedData);

      // 검증: BigInt는 string으로, Decimal은 toString() 결과로 변환되었는지
      const callArg = redisClientMock.set.mock.calls[0][1]; // 두 번째 인자 (값)
      const parsed = JSON.parse(callArg);

      expect(parsed.user.id).toBe('999999999999');
      expect(parsed.user.balance).toBe('100.50');
      // Date는 JSON.stringify에 의해 자동으로 ISO string이 됨
      expect(parsed.user.history[0].date).toBe('2025-01-01T00:00:00.000Z');
    });

    it('should handle null and undefined safely', async () => {
      redisClientMock.set.mockResolvedValue('OK');

      // Null 저장
      await service.set('null_key', null);
      expect(redisClientMock.set).toHaveBeenCalledWith(
        'null_key',
        'null',
        'EX',
        expect.any(Number),
      );

      // Undefined 저장 (JSON.stringify(undefined)는 undefined이나, 함수 인자로 넘어가면 처리 필요)
      // 보통 undefined를 캐시에 넣지는 않지만, 넣는다면 에러가 나지 않아야 함
      await service.set('undefined_key', undefined);
      // JSON.stringify(undefined) -> undefined. Redis set은 string을 기대하므로 앱 로직에 따라 다르지만
      // 현재 로직상 'undefined' 문자열이 되거나 처리가 안될 수 있음.
      // 여기서는 에러가 안 나는지만 확인
    });

    it('should NOT convert non-ISO date strings', async () => {
      // ISO 포맷이 아닌 날짜 문자열
      const plainDate = '2025-01-01';
      const json = JSON.stringify({ date: plainDate });
      redisClientMock.get.mockResolvedValue(json);

      const result = await service.get<any>('key');

      // Date 객체로 변환되지 않고 문자열 유지
      expect(typeof result.date).toBe('string');
      expect(result.date).toBe('2025-01-01');
    });

    it('should handle Redis connection errors gracefully', async () => {
      // Redis 연결 끊짐 시뮬레이션
      redisClientMock.set.mockRejectedValue(new Error('Connection lost'));
      redisClientMock.get.mockRejectedValue(new Error('Connection lost'));

      // Set 실패 시 false 반환 확인 (혹은 에러를 삼키고 로깅하는지)
      const setResult = await service.set('key', 'value');
      expect(setResult).toBe(false);

      // Get 실패 시 null 반환 확인
      const getResult = await service.get('key');
      expect(getResult).toBeNull();
    });
  });
});
