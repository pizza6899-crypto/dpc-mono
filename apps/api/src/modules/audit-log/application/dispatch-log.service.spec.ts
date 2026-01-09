import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { DispatchLogService } from './dispatch-log.service';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import { LogType } from '../domain';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import {
  CRITICAL_LOG_QUEUE_NAME,
  HEAVY_LOG_QUEUE_NAME,
} from '../infrastructure/queue.constants';

describe('DispatchLogService', () => {
  let service: DispatchLogService;
  let criticalQueue: any;
  let heavyQueue: any;
  let snowflakeService: SnowflakeService;

  const mockQueue = {
    add: jest.fn().mockResolvedValue({}),
  };

  const mockSnowflakeService = {
    generateFromTimestamp: jest.fn().mockReturnValue(1234567890n),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DispatchLogService,
        {
          provide: getQueueToken(CRITICAL_LOG_QUEUE_NAME),
          useValue: mockQueue,
        },
        {
          provide: getQueueToken(HEAVY_LOG_QUEUE_NAME),
          useValue: mockQueue,
        },
        {
          provide: SnowflakeService,
          useValue: mockSnowflakeService,
        },
      ],
    }).compile();

    service = module.get<DispatchLogService>(DispatchLogService);
    criticalQueue = module.get(getQueueToken(CRITICAL_LOG_QUEUE_NAME));
    heavyQueue = module.get(getQueueToken(HEAVY_LOG_QUEUE_NAME));
    snowflakeService = module.get<SnowflakeService>(SnowflakeService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('dispatch - AUTH 로그', () => {
    it('AUTH 로그를 critical 큐에 추가해야 함', async () => {
      const payload = {
        type: LogType.AUTH,
        data: {
          action: 'LOGIN',
          status: 'SUCCESS',
          userId: '123',
        },
      };

      await service.dispatch(payload);

      expect(snowflakeService.generateFromTimestamp).toHaveBeenCalled();
      expect(criticalQueue.add).toHaveBeenCalledWith(
        'auth-log',
        expect.objectContaining({
          id: '1234567890',
          createdAt: expect.any(String),
          payload: expect.objectContaining({
            type: LogType.AUTH,
          }),
        }),
        expect.objectContaining({
          jobId: '1234567890',
          removeOnComplete: true,
          attempts: 10,
        }),
      );
    });

    it('clientInfo가 제공되면 AUTH 로그에 Cloudflare 정보를 추가해야 함', async () => {
      const payload = {
        type: LogType.AUTH,
        data: {
          action: 'LOGIN',
          status: 'SUCCESS',
        },
      };

      const clientInfo: RequestClientInfo = {
        ip: '1.2.3.4',
        userAgent: 'Mozilla/5.0',
        country: 'KR',
        city: 'Seoul',
        cfRay: 'test-ray-id',
        isMobile: false,
        bot: false,
        threat: null,
        fingerprint: 'test-fingerprint',
        sessionId: 'test-session',
        traceId: 'test-trace',
      };

      await service.dispatch(payload, clientInfo);

      expect(criticalQueue.add).toHaveBeenCalledWith(
        'auth-log',
        expect.objectContaining({
          payload: expect.objectContaining({
            data: expect.objectContaining({
              ip: '1.2.3.4',
              country: 'KR',
              city: 'Seoul',
              cfRay: 'test-ray-id',
              sessionId: 'test-session',
              traceId: 'test-trace',
            }),
          }),
        }),
        expect.any(Object),
      );
    });
  });

  describe('dispatch - INTEGRATION 로그', () => {
    it('INTEGRATION 로그를 critical 큐에 추가해야 함', async () => {
      const payload = {
        type: LogType.INTEGRATION,
        data: {
          provider: 'payment-gateway',
          method: 'POST',
          endpoint: '/api/payment',
          duration: 150,
          success: true,
        },
      };

      await service.dispatch(payload);

      expect(criticalQueue.add).toHaveBeenCalledWith(
        'integration-log',
        expect.objectContaining({
          id: '1234567890',
          payload: expect.objectContaining({
            type: LogType.INTEGRATION,
          }),
        }),
        expect.objectContaining({
          attempts: 10,
        }),
      );
    });
  });

  describe('dispatch - ACTIVITY 로그', () => {
    it('ACTIVITY 로그를 heavy 큐에 추가해야 함', async () => {
      const payload = {
        type: LogType.ACTIVITY,
        data: {
          category: 'USER',
          action: 'PROFILE_UPDATE',
          userId: '123',
        },
      };

      await service.dispatch(payload);

      expect(heavyQueue.add).toHaveBeenCalledWith(
        'activity-log',
        expect.objectContaining({
          id: '1234567890',
          payload: expect.objectContaining({
            type: LogType.ACTIVITY,
          }),
        }),
        expect.objectContaining({
          attempts: 3,
        }),
      );
    });
  });

  describe('dispatch - ERROR 로그', () => {
    it('ERROR 로그를 heavy 큐에 추가해야 함', async () => {
      const payload = {
        type: LogType.ERROR,
        data: {
          errorMessage: 'Test error',
          severity: 'ERROR' as const,
        },
      };

      await service.dispatch(payload);

      expect(heavyQueue.add).toHaveBeenCalledWith(
        'error-log',
        expect.objectContaining({
          id: '1234567890',
          payload: expect.objectContaining({
            type: LogType.ERROR,
          }),
        }),
        expect.objectContaining({
          attempts: 3,
        }),
      );
    });
  });

  describe('Snowflake ID 및 타임스탬프', () => {
    it('동일한 타임스탬프로 Snowflake ID를 생성해야 함', async () => {
      const payload = {
        type: LogType.AUTH,
        data: {
          action: 'LOGIN',
          status: 'SUCCESS',
        },
      };

      await service.dispatch(payload);

      // generateFromTimestamp가 호출되었는지 확인
      expect(snowflakeService.generateFromTimestamp).toHaveBeenCalledTimes(1);

      // 호출된 인자가 Date 객체인지 확인
      const callArg = (snowflakeService.generateFromTimestamp as jest.Mock).mock.calls[0][0];
      expect(callArg).toBeInstanceOf(Date);
    });

    it('생성된 ID와 타임스탬프를 큐 데이터에 포함해야 함', async () => {
      const payload = {
        type: LogType.AUTH,
        data: {
          action: 'LOGIN',
          status: 'SUCCESS',
        },
      };

      await service.dispatch(payload);

      expect(criticalQueue.add).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          id: '1234567890',
          createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/), // ISO 8601 형식
          payload: expect.any(Object),
        }),
        expect.any(Object),
      );
    });
  });

  describe('에러 처리', () => {
    it('큐 추가 실패 시 에러를 로깅하고 던지지 않아야 함', async () => {
      const loggerErrorSpy = jest.spyOn(service['logger'], 'error');
      criticalQueue.add.mockRejectedValueOnce(new Error('Queue error'));

      const payload = {
        type: LogType.AUTH,
        data: {
          action: 'LOGIN',
          status: 'SUCCESS',
        },
      };

      await expect(service.dispatch(payload)).resolves.not.toThrow();
      expect(loggerErrorSpy).toHaveBeenCalled();
    });
  });
});
