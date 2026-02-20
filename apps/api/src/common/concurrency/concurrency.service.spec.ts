import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConcurrencyService } from './concurrency.service';
import { NodeIdentityService } from 'src/common/node-identity/node-identity.service';
import { getTransactionToken } from '@nestjs-cls/transactional';

// Mock Transaction with GlobalLock model
const mockTx = {
  $kysely: {},
  globalLock: {
    updateMany: jest.fn(),
    update: jest.fn(),
  },
};

// Mock NodeIdentityService
const mockNodeIdentityService = {
  getDisplayId: jest.fn().mockReturnValue('node-1-host-uuid'),
};

// Mock Kysely sql
jest.mock('kysely', () => ({
  sql: jest.fn(() => ({
    execute: jest.fn().mockResolvedValue({ numAffectedRows: 1n }),
  })),
}));

describe('ConcurrencyService', () => {
  let service: ConcurrencyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConcurrencyService,
        {
          provide: getTransactionToken(), // Correct token for @InjectTransaction() without arguments
          useValue: mockTx,
        },
        {
          provide: NodeIdentityService,
          useValue: mockNodeIdentityService,
        },
      ],
    }).compile();

    service = module.get<ConcurrencyService>(ConcurrencyService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('tryAcquire', () => {
    it('should return true when lock is successfully acquired', async () => {
      const result = await service.tryAcquire('test-key');
      expect(result).toBe(true);
    });

    it('should return false when lock acquisition fails (0 rows affected)', async () => {
      // Kysely sql mock 재정의
      const kyselyMock = require('kysely');
      kyselyMock.sql.mockImplementationOnce(() => ({
        execute: jest.fn().mockResolvedValue({ numAffectedRows: 0n }),
      }));

      const result = await service.tryAcquire('test-key');
      expect(result).toBe(false);
    });
  });

  describe('release', () => {
    it('should call updateMany with correct ownership conditions', async () => {
      mockTx.globalLock.updateMany.mockResolvedValue({ count: 1 });

      await service.release('test-key', true);

      expect(mockTx.globalLock.updateMany).toHaveBeenCalledWith({
        where: {
          key: 'test-key',
          instanceId: 'node-1-host-uuid', // From mockNodeIdentityService
          isAcquired: true,
        },
        data: expect.objectContaining({
          isAcquired: false,
          lastResult: 'SUCCESS',
        }),
      });
    });

    it('should log warning if lock was not released (stolen or missing)', async () => {
      mockTx.globalLock.updateMany.mockResolvedValue({ count: 0 }); // 0 rows updated
      const loggerSpy = jest
        .spyOn((service as any).logger, 'warn')
        .mockImplementation(() => {});

      await service.release('test-key', true);

      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('runExclusive', () => {
    it('should acquire lock, run task, and release lock', async () => {
      const task = jest.fn().mockResolvedValue(undefined);
      const acquireSpy = jest
        .spyOn(service, 'tryAcquire')
        .mockResolvedValue(true);
      const releaseSpy = jest.spyOn(service, 'release');

      await service.runExclusive('test-task', task);

      expect(acquireSpy).toHaveBeenCalledWith('test-task', {});
      expect(task).toHaveBeenCalled();
      expect(releaseSpy).toHaveBeenCalledWith('test-task', true);
    });

    it('should not run task if lock is not acquired', async () => {
      const task = jest.fn();
      jest.spyOn(service, 'tryAcquire').mockResolvedValue(false);

      await service.runExclusive('test-task', task);

      expect(task).not.toHaveBeenCalled();
    });

    it('should release lock with failure status if task throws error', async () => {
      const task = jest.fn().mockRejectedValue(new Error('Task Failed'));
      jest.spyOn(service, 'tryAcquire').mockResolvedValue(true);
      const releaseSpy = jest.spyOn(service, 'release');
      // 의도된 에러 로그를 숨기기 위해 spy mockImplementation 추가
      const loggerSpy = jest
        .spyOn((service as any).logger, 'error')
        .mockImplementation(() => {});

      await expect(service.runExclusive('test-task', task)).rejects.toThrow(
        'Task Failed',
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('작업 실행 중 에러'),
        expect.any(Error),
      );
      expect(releaseSpy).toHaveBeenCalledWith(
        'test-task',
        false,
        'Task Failed',
      );
    });
  });
});
