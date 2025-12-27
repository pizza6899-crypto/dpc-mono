import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConcurrencyService } from './concurrency.service';
import { RedisService } from '../redis/redis.service';
import { Logger } from '@nestjs/common';
import { EnvService } from '../env/env.service';
import { EnvModule } from '../env/env.module';

describe('ConcurrencyService', () => {
  let service: ConcurrencyService;
  let mockRedisService: jest.Mocked<RedisService>;
  let mockEnvService: jest.Mocked<EnvService>;

  beforeEach(async () => {
    const mockRedisServiceProvider = {
      provide: RedisService,
      useValue: {
        setLock: jest.fn(),
        eval: jest.fn(),
        exists: jest.fn(),
        keys: jest.fn(),
        del: jest.fn(),
      },
    };

    const mockEnvServiceProvider = {
      provide: EnvService,
      useValue: {
        pm2InstanceNumber: '0',
        nodeEnv: 'test',
        app: {},
        jwt: {},
        redis: {},
        googleOAuth: {},
        whitecliff: {},
        all: {},
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [EnvModule],
      providers: [
        ConcurrencyService,
        mockRedisServiceProvider,
        mockEnvServiceProvider,
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            debug: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ConcurrencyService>(ConcurrencyService);
    mockRedisService = module.get(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('acquireUserLock', () => {
    it('should acquire user lock successfully', async () => {
      mockRedisService.setLock.mockResolvedValue(true);

      const result = await service.acquireUserLock('user123', 'balance');

      expect(result).toBeDefined();
      expect(result?.key).toBe('lock:user:user123:balance');
      expect(mockRedisService.setLock).toHaveBeenCalledWith(
        'lock:user:user123:balance',
        expect.any(String),
        30,
      );
    });

    it('should return null when lock acquisition fails', async () => {
      mockRedisService.setLock.mockResolvedValue(false);

      const result = await service.acquireUserLock('user123', 'balance');

      expect(result).toBeNull();
    });

    it('should retry when lock acquisition fails', async () => {
      mockRedisService.setLock
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const result = await service.acquireUserLock('user123', 'balance', {
        retryCount: 2,
        retryDelay: 10,
      });

      expect(result).toBeDefined();
      expect(mockRedisService.setLock).toHaveBeenCalledTimes(3);
    });
  });

  describe('releaseLock', () => {
    it('should release lock successfully', async () => {
      mockRedisService.eval.mockResolvedValue(1);

      const lock = {
        key: 'lock:user:user123:balance',
        value: 'test-value',
        ttl: 30,
      };

      const result = await service.releaseLock(lock);

      expect(result).toBe(true);
      expect(mockRedisService.eval).toHaveBeenCalledWith(
        expect.any(String),
        1,
        lock.key,
        lock.value,
      );
    });

    it('should fail to release lock when not owner', async () => {
      mockRedisService.eval.mockResolvedValue(0);

      const lock = {
        key: 'lock:user:user123:balance',
        value: 'test-value',
        ttl: 30,
      };

      const result = await service.releaseLock(lock);

      expect(result).toBe(false);
    });
  });

  describe('withUserLock', () => {
    it('should execute callback with lock', async () => {
      mockRedisService.setLock.mockResolvedValue(true);
      mockRedisService.eval.mockResolvedValue(1);

      const callback = jest.fn().mockResolvedValue('test-result');

      const result = await service.withUserLock({
        userId: 'user123',
        operation: 'balance',
        callback,
      });

      expect(result).toBe('test-result');
      expect(callback).toHaveBeenCalled();
      expect(mockRedisService.setLock).toHaveBeenCalled();
      expect(mockRedisService.eval).toHaveBeenCalled();
    });

    it('should release lock even when callback throws error', async () => {
      mockRedisService.setLock.mockResolvedValue(true);
      mockRedisService.eval.mockResolvedValue(1);

      const callback = jest.fn().mockRejectedValue(new Error('Test error'));

      await expect(
        service.withUserLock({
          userId: 'user123',
          operation: 'balance',
          callback,
        }),
      ).rejects.toThrow('Test error');

      expect(mockRedisService.eval).toHaveBeenCalled();
    });
  });

  describe('getLockStats', () => {
    it('should return lock statistics', async () => {
      mockRedisService.keys
        .mockResolvedValueOnce(['lock:user:1:balance', 'lock:user:2:balance'])
        .mockResolvedValueOnce(['lock:user:1:balance', 'lock:user:2:balance'])
        .mockResolvedValueOnce(['lock:instance:123:test'])
        .mockResolvedValueOnce(['lock:global:maintenance'])
        .mockResolvedValueOnce(['lock:instance:123:test'])
        .mockResolvedValueOnce(['lock:user:1:balance'])
        .mockResolvedValueOnce(['lock:user:1:profile'])
        .mockResolvedValueOnce(['lock:user:1:auth']);

      const stats = await service.getLockStats();

      expect(stats).toEqual({
        totalLocks: 2,
        userLocks: 2,
        instanceLocks: 1,
        globalLocks: 1,
        currentInstanceLocks: 1,
        balanceLocks: 1,
        profileLocks: 1,
        authLocks: 1,
      });
    });
  });
});
