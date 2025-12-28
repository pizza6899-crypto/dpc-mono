// src/modules/affiliate/commission/schedulers/settle-daily-commissions.scheduler.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { SettleDailyCommissionsScheduler } from './settle-daily-commissions.scheduler';
import { SettleDailyCommissionsService } from '../application/settle-daily-commissions.service';
import { EnvService } from 'src/platform/env/env.service';
import { ConcurrencyService } from 'src/platform/concurrency/concurrency.service';
import { Prisma } from '@repo/database';
import { nowUtc } from 'src/utils/date.util';

// nowUtc 모킹
jest.mock('src/utils/date.util', () => ({
  nowUtc: jest.fn(),
}));

describe('SettleDailyCommissionsScheduler', () => {
  let scheduler: SettleDailyCommissionsScheduler;
  let settleDailyCommissionsService: jest.Mocked<SettleDailyCommissionsService>;
  let envService: jest.Mocked<EnvService>;
  let concurrencyService: jest.Mocked<ConcurrencyService>;
  let loggerSpy: {
    log: jest.SpyInstance;
    debug: jest.SpyInstance;
    error: jest.SpyInstance;
  };

  const mockSettlementDate = new Date('2024-01-15T00:00:00Z');
  const mockCurrentDate = new Date('2024-01-16T01:00:00Z'); // 정산 기준일 다음날 01:00

  beforeEach(async () => {
    // nowUtc 모킹 설정
    (nowUtc as jest.Mock).mockReturnValue(mockCurrentDate);

    const mockSettleDailyCommissionsService = {
      execute: jest.fn(),
    };

    const mockEnvService = {
      scheduler: {
        enabled: true,
        settleDailyCommissionsEnabled: true,
      },
    } as any;

    const mockConcurrencyService = {
      acquireGlobalLock: jest.fn(),
      releaseLock: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettleDailyCommissionsScheduler,
        {
          provide: SettleDailyCommissionsService,
          useValue: mockSettleDailyCommissionsService,
        },
        {
          provide: EnvService,
          useValue: mockEnvService,
        },
        {
          provide: ConcurrencyService,
          useValue: mockConcurrencyService,
        },
      ],
    }).compile();

    scheduler = module.get<SettleDailyCommissionsScheduler>(
      SettleDailyCommissionsScheduler,
    );
    settleDailyCommissionsService = module.get(SettleDailyCommissionsService);
    envService = module.get(EnvService);
    concurrencyService = module.get(ConcurrencyService);

    // Logger는 스케줄러 내부에서 생성되므로 spyOn 사용
    loggerSpy = {
      log: jest.spyOn(Logger.prototype, 'log').mockImplementation(),
      debug: jest.spyOn(Logger.prototype, 'debug').mockImplementation(),
      error: jest.spyOn(Logger.prototype, 'error').mockImplementation(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    loggerSpy.log.mockRestore();
    loggerSpy.debug.mockRestore();
    loggerSpy.error.mockRestore();
  });

  describe('settleDailyCommissions', () => {
    it('정상적으로 커미션 정산을 처리한다', async () => {
      // Given
      const mockLock = {
        key: 'settle-daily-commissions-scheduler',
        value: 'lock-value',
        ttl: 3600,
      };

      const mockResult = {
        settledCount: 100,
        totalAmount: new Prisma.Decimal('5000.00'),
      };

      envService.scheduler.enabled = true;
      envService.scheduler.settleDailyCommissionsEnabled = true;
      concurrencyService.acquireGlobalLock.mockResolvedValue(mockLock);
      concurrencyService.releaseLock.mockResolvedValue(true);
      settleDailyCommissionsService.execute.mockResolvedValue(mockResult);

      // When
      await scheduler.settleDailyCommissions();

      // Then
      expect(concurrencyService.acquireGlobalLock).toHaveBeenCalledWith(
        'settle-daily-commissions-scheduler',
        {
          ttl: 3600,
          retryCount: 0,
        },
      );

      // 전날 날짜 계산 확인
      const expectedSettlementDate = new Date(mockCurrentDate);
      expectedSettlementDate.setUTCDate(
        expectedSettlementDate.getUTCDate() - 1,
      );
      expectedSettlementDate.setUTCHours(0, 0, 0, 0);

      expect(settleDailyCommissionsService.execute).toHaveBeenCalledWith({
        settlementDate: expectedSettlementDate,
      });

      expect(loggerSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('일일 커미션 정산 시작'),
      );
      expect(loggerSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('일일 커미션 정산 완료'),
      );
      expect(concurrencyService.releaseLock).toHaveBeenCalledWith(mockLock);
    });

    it('스케줄러가 비활성화된 경우 실행하지 않는다', async () => {
      // Given
      envService.scheduler.enabled = false;
      envService.scheduler.settleDailyCommissionsEnabled = true;

      // When
      await scheduler.settleDailyCommissions();

      // Then
      expect(concurrencyService.acquireGlobalLock).not.toHaveBeenCalled();
      expect(settleDailyCommissionsService.execute).not.toHaveBeenCalled();
      expect(loggerSpy.debug).toHaveBeenCalledWith(
        '스케줄러가 비활성화되어 있습니다.',
      );
    });

    it('커미션 정산 스케줄러가 비활성화된 경우 실행하지 않는다', async () => {
      // Given
      envService.scheduler.enabled = true;
      envService.scheduler.settleDailyCommissionsEnabled = false;

      // When
      await scheduler.settleDailyCommissions();

      // Then
      expect(concurrencyService.acquireGlobalLock).not.toHaveBeenCalled();
      expect(settleDailyCommissionsService.execute).not.toHaveBeenCalled();
      expect(loggerSpy.debug).toHaveBeenCalledWith(
        '커미션 정산 스케줄러가 비활성화되어 있습니다.',
      );
    });

    it('락을 못 잡은 경우 실행하지 않는다', async () => {
      // Given
      envService.scheduler.enabled = true;
      envService.scheduler.settleDailyCommissionsEnabled = true;
      concurrencyService.acquireGlobalLock.mockResolvedValue(null);

      // When
      await scheduler.settleDailyCommissions();

      // Then
      expect(settleDailyCommissionsService.execute).not.toHaveBeenCalled();
      expect(loggerSpy.debug).toHaveBeenCalledWith(
        '다른 인스턴스에서 이미 커미션 정산 스케줄러가 실행 중입니다.',
      );
      expect(concurrencyService.releaseLock).not.toHaveBeenCalled();
    });

    it('정산 서비스 실행 중 에러가 발생하면 로깅하고 락을 해제한다', async () => {
      // Given
      const mockLock = {
        key: 'settle-daily-commissions-scheduler',
        value: 'lock-value',
        ttl: 3600,
      };

      const mockError = new Error('정산 처리 중 오류 발생');

      envService.scheduler.enabled = true;
      envService.scheduler.settleDailyCommissionsEnabled = true;
      concurrencyService.acquireGlobalLock.mockResolvedValue(mockLock);
      concurrencyService.releaseLock.mockResolvedValue(true);
      settleDailyCommissionsService.execute.mockRejectedValue(mockError);

      // When
      await scheduler.settleDailyCommissions();

      // Then
      expect(settleDailyCommissionsService.execute).toHaveBeenCalled();
      expect(loggerSpy.error).toHaveBeenCalledWith(
        '일일 커미션 정산 중 오류 발생',
        mockError,
      );
      expect(concurrencyService.releaseLock).toHaveBeenCalledWith(mockLock);
    });

    it('전날 날짜를 올바르게 계산한다', async () => {
      // Given
      const mockLock = {
        key: 'settle-daily-commissions-scheduler',
        value: 'lock-value',
        ttl: 3600,
      };

      const mockResult = {
        settledCount: 0,
        totalAmount: new Prisma.Decimal('0'),
      };

      // 현재 시간을 2024-01-16 01:00:00 UTC로 설정
      const testDate = new Date('2024-01-16T01:00:00Z');
      (nowUtc as jest.Mock).mockReturnValue(testDate);

      envService.scheduler.enabled = true;
      envService.scheduler.settleDailyCommissionsEnabled = true;
      concurrencyService.acquireGlobalLock.mockResolvedValue(mockLock);
      concurrencyService.releaseLock.mockResolvedValue(true);
      settleDailyCommissionsService.execute.mockResolvedValue(mockResult);

      // When
      await scheduler.settleDailyCommissions();

      // Then
      // 전날 00:00:00 UTC가 정산 기준일이어야 함
      const expectedSettlementDate = new Date('2024-01-15T00:00:00Z');
      expect(settleDailyCommissionsService.execute).toHaveBeenCalledWith({
        settlementDate: expectedSettlementDate,
      });
    });

    it('월말 경계에서도 전날 날짜를 올바르게 계산한다', async () => {
      // Given
      const mockLock = {
        key: 'settle-daily-commissions-scheduler',
        value: 'lock-value',
        ttl: 3600,
      };

      const mockResult = {
        settledCount: 0,
        totalAmount: new Prisma.Decimal('0'),
      };

      // 2024-02-01 01:00:00 UTC (전날은 2024-01-31)
      const testDate = new Date('2024-02-01T01:00:00Z');
      (nowUtc as jest.Mock).mockReturnValue(testDate);

      envService.scheduler.enabled = true;
      envService.scheduler.settleDailyCommissionsEnabled = true;
      concurrencyService.acquireGlobalLock.mockResolvedValue(mockLock);
      concurrencyService.releaseLock.mockResolvedValue(true);
      settleDailyCommissionsService.execute.mockResolvedValue(mockResult);

      // When
      await scheduler.settleDailyCommissions();

      // Then
      const expectedSettlementDate = new Date('2024-01-31T00:00:00Z');
      expect(settleDailyCommissionsService.execute).toHaveBeenCalledWith({
        settlementDate: expectedSettlementDate,
      });
    });

    it('정산 결과를 올바르게 로깅한다', async () => {
      // Given
      const mockLock = {
        key: 'settle-daily-commissions-scheduler',
        value: 'lock-value',
        ttl: 3600,
      };

      const mockResult = {
        settledCount: 250,
        totalAmount: new Prisma.Decimal('12500.50'),
      };

      envService.scheduler.enabled = true;
      envService.scheduler.settleDailyCommissionsEnabled = true;
      concurrencyService.acquireGlobalLock.mockResolvedValue(mockLock);
      concurrencyService.releaseLock.mockResolvedValue(true);
      settleDailyCommissionsService.execute.mockResolvedValue(mockResult);

      // When
      await scheduler.settleDailyCommissions();

      // Then
      // 로그 메시지에 정산 건수와 총 금액이 포함되어야 함
      // Prisma.Decimal의 toString()은 뒤의 0을 제거할 수 있음 (12500.50 -> 12500.5)
      expect(loggerSpy.log).toHaveBeenCalledWith(
        expect.stringMatching(
          /일일 커미션 정산 완료.*정산 건수: 250.*총 금액: 12500\.5/,
        ),
      );
    });

    it('락 해제 실패 시 에러가 전파된다', async () => {
      // Given
      const mockLock = {
        key: 'settle-daily-commissions-scheduler',
        value: 'lock-value',
        ttl: 3600,
      };

      const mockResult = {
        settledCount: 100,
        totalAmount: new Prisma.Decimal('5000.00'),
      };

      const releaseError = new Error('락 해제 실패');

      envService.scheduler.enabled = true;
      envService.scheduler.settleDailyCommissionsEnabled = true;
      concurrencyService.acquireGlobalLock.mockResolvedValue(mockLock);
      concurrencyService.releaseLock.mockRejectedValue(releaseError);
      settleDailyCommissionsService.execute.mockResolvedValue(mockResult);

      // When & Then
      // finally 블록에서 발생한 에러는 전파됨
      await expect(scheduler.settleDailyCommissions()).rejects.toThrow(
        '락 해제 실패',
      );
      expect(settleDailyCommissionsService.execute).toHaveBeenCalled();
    });
  });
});
