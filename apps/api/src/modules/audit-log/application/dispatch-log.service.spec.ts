// src/modules/audit-log/application/dispatch-log.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { DispatchLogService } from './dispatch-log.service';
import type { LogJobData } from '../domain';
import { LogType } from '../domain';
import {
  CRITICAL_LOG_QUEUE_NAME,
  HEAVY_LOG_QUEUE_NAME,
} from '../infrastructure/queue.constants';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';

describe('DispatchLogService', () => {
  let service: DispatchLogService;
  let mockCriticalQueue: jest.Mocked<Queue>;
  let mockHeavyQueue: jest.Mocked<Queue>;
  let mockSnowflakeService: jest.Mocked<SnowflakeService>;
  let loggerErrorSpy: jest.SpyInstance;

  const mockSnowflakeId = 123456789012345678n;

  beforeEach(async () => {
    mockCriticalQueue = {
      add: jest.fn().mockResolvedValue({}),
    } as any;

    mockHeavyQueue = {
      add: jest.fn().mockResolvedValue({}),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DispatchLogService,
        {
          provide: getQueueToken(CRITICAL_LOG_QUEUE_NAME),
          useValue: mockCriticalQueue,
        },
        {
          provide: getQueueToken(HEAVY_LOG_QUEUE_NAME),
          useValue: mockHeavyQueue,
        },
        {
          provide: SnowflakeService,
          useValue: {
            nextId: jest.fn().mockReturnValue(mockSnowflakeId),
          },
        },
      ],
    }).compile();

    service = module.get<DispatchLogService>(DispatchLogService);
    mockSnowflakeService = module.get(SnowflakeService);

    // Logger는 서비스 내부에서 생성되므로 prototype에 spy 설정
    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation();

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('dispatch', () => {
    describe('CRITICAL 큐 (AUTH, INTEGRATION)', () => {
      it('AUTH 타입 로그를 CRITICAL 큐에 추가해야 함', async () => {
        const payload: LogJobData = {
          type: LogType.AUTH,
          data: {
            userId: 'user-123',
            action: 'LOGIN',
            status: 'SUCCESS',
            ip: '127.0.0.1',
            userAgent: 'test-agent',
          },
        };

        await service.dispatch(payload);

        expect(mockCriticalQueue.add).toHaveBeenCalledWith(
          'auth-log',
          {
            id: mockSnowflakeId.toString(),
            payload,
          },
          {
            jobId: mockSnowflakeId.toString(),
            removeOnComplete: true,
            attempts: 10,
            backoff: { type: 'exponential', delay: 1000 },
          },
        );
        expect(mockHeavyQueue.add).not.toHaveBeenCalled();
      });

      it('INTEGRATION 타입 로그를 CRITICAL 큐에 추가해야 함', async () => {
        const payload: LogJobData = {
          type: LogType.INTEGRATION,
          data: {
            userId: 'user-123',
            provider: 'test-provider',
            method: 'POST',
            endpoint: '/api/test',
            statusCode: 200,
            duration: 100,
            success: true,
          },
        };

        await service.dispatch(payload);

        expect(mockCriticalQueue.add).toHaveBeenCalledWith(
          'integration-log',
          {
            id: mockSnowflakeId.toString(),
            payload,
          },
          {
            jobId: mockSnowflakeId.toString(),
            removeOnComplete: true,
            attempts: 10,
            backoff: { type: 'exponential', delay: 1000 },
          },
        );
        expect(mockHeavyQueue.add).not.toHaveBeenCalled();
      });
    });

    describe('HEAVY 큐 (ACTIVITY, ERROR)', () => {
      it('ACTIVITY 타입 로그를 HEAVY 큐에 추가해야 함', async () => {
        const payload: LogJobData = {
          type: LogType.ACTIVITY,
          data: {
            userId: 'user-123',
            category: 'AUTH',
            action: 'USER_LOGIN',
            metadata: { test: 'data' },
          },
        };

        await service.dispatch(payload);

        expect(mockHeavyQueue.add).toHaveBeenCalledWith(
          'activity-log',
          {
            id: mockSnowflakeId.toString(),
            payload,
          },
          {
            jobId: mockSnowflakeId.toString(),
            removeOnComplete: true,
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
          },
        );
        expect(mockCriticalQueue.add).not.toHaveBeenCalled();
      });

      it('ERROR 타입 로그를 HEAVY 큐에 추가해야 함', async () => {
        const payload: LogJobData = {
          type: LogType.ERROR,
          data: {
            userId: 'user-123',
            errorCode: 'TEST_ERROR',
            errorMessage: 'Test error message',
            stackTrace: 'stack trace',
            path: '/api/test',
            method: 'POST',
            severity: 'ERROR',
          },
        };

        await service.dispatch(payload);

        expect(mockHeavyQueue.add).toHaveBeenCalledWith(
          'error-log',
          {
            id: mockSnowflakeId.toString(),
            payload,
          },
          {
            jobId: mockSnowflakeId.toString(),
            removeOnComplete: true,
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
          },
        );
        expect(mockCriticalQueue.add).not.toHaveBeenCalled();
      });
    });

    describe('에러 처리', () => {
      it('큐 추가 실패 시 에러를 로깅하고 throw하지 않아야 함', async () => {
        const payload: LogJobData = {
          type: LogType.AUTH,
          data: {
            action: 'LOGIN',
            status: 'SUCCESS',
          },
        };

        const error = new Error('Queue add failed');
        mockCriticalQueue.add.mockRejectedValue(error);

        await expect(service.dispatch(payload)).resolves.not.toThrow();

        expect(loggerErrorSpy).toHaveBeenCalledWith(
          `로그 디스패치 실패 - type: ${LogType.AUTH}`,
          error.stack,
        );
      });

      it('큐 추가 실패 시 Error가 아닌 경우에도 로깅해야 함', async () => {
        const payload: LogJobData = {
          type: LogType.ACTIVITY,
          data: {
            category: 'TEST',
            action: 'TEST_ACTION',
          },
        };

        const error = 'String error';
        mockHeavyQueue.add.mockRejectedValue(error);

        await expect(service.dispatch(payload)).resolves.not.toThrow();

        expect(loggerErrorSpy).toHaveBeenCalledWith(
          `로그 디스패치 실패 - type: ${LogType.ACTIVITY}`,
          String(error),
        );
      });
    });

    describe('ID 생성', () => {
      it('각 dispatch마다 새로운 Snowflake ID를 생성해야 함', async () => {
        const payload1: LogJobData = {
          type: LogType.AUTH,
          data: {
            action: 'LOGIN',
            status: 'SUCCESS',
          },
        };

        const payload2: LogJobData = {
          type: LogType.ACTIVITY,
          data: {
            category: 'TEST',
            action: 'TEST_ACTION',
          },
        };

        const id1 = 123456789012345678n;
        const id2 = 987654321098765432n;

        mockSnowflakeService.nextId
          .mockReturnValueOnce(id1)
          .mockReturnValueOnce(id2);

        await service.dispatch(payload1);
        await service.dispatch(payload2);

        expect(mockCriticalQueue.add).toHaveBeenCalledWith(
          expect.any(String),
          { id: id1.toString(), payload: payload1 },
          expect.objectContaining({ jobId: id1.toString() }),
        );

        expect(mockHeavyQueue.add).toHaveBeenCalledWith(
          expect.any(String),
          { id: id2.toString(), payload: payload2 },
          expect.objectContaining({ jobId: id2.toString() }),
        );
      });
    });

    describe('Cloudflare 정보 자동 매핑', () => {
      const mockClientInfo: RequestClientInfo = {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        protocol: 'https',
        method: 'POST',
        path: '/api/test',
        timestamp: new Date(),
        country: 'KR',
        city: 'Seoul',
        referer: 'https://example.com',
        acceptLanguage: 'ko-KR',
        fingerprint: 'fingerprint-123',
        isMobile: true,
        browser: 'Chrome',
        os: 'iOS',
        timezone: 'Asia/Seoul',
        isp: 'ISP',
        asn: 'AS123',
        threat: 'low',
        bot: false,
        cfRay: 'cf-ray-123',
        cfRequestId: 'cf-request-id-123',
        cfColo: 'ICN',
      };

      describe('AUTH 로그', () => {
        it('clientInfo가 제공되면 Cloudflare 정보가 자동으로 매핑되어야 함', async () => {
          const payload: LogJobData = {
            type: LogType.AUTH,
            data: {
              userId: 'user-123',
              action: 'LOGIN',
              status: 'SUCCESS',
              metadata: { isAdmin: false },
            },
          };

          await service.dispatch(payload, mockClientInfo);

          expect(mockCriticalQueue.add).toHaveBeenCalledWith(
            'auth-log',
            {
              id: mockSnowflakeId.toString(),
              payload: {
                type: LogType.AUTH,
                data: {
                  userId: 'user-123',
                  action: 'LOGIN',
                  status: 'SUCCESS',
                  metadata: { isAdmin: false },
                  ip: mockClientInfo.ip,
                  userAgent: mockClientInfo.userAgent,
                  deviceFingerprint: mockClientInfo.fingerprint,
                  country: mockClientInfo.country,
                  city: mockClientInfo.city,
                  bot: mockClientInfo.bot,
                  threat: mockClientInfo.threat,
                  isMobile: mockClientInfo.isMobile,
                  cfRay: mockClientInfo.cfRay,
                },
              },
            },
            expect.objectContaining({
              jobId: mockSnowflakeId.toString(),
            }),
          );
        });

        it('clientInfo가 없으면 기존 payload 그대로 사용해야 함', async () => {
          const payload: LogJobData = {
            type: LogType.AUTH,
            data: {
              userId: 'user-123',
              action: 'LOGIN',
              status: 'SUCCESS',
            },
          };

          await service.dispatch(payload);

          expect(mockCriticalQueue.add).toHaveBeenCalledWith(
            'auth-log',
            {
              id: mockSnowflakeId.toString(),
              payload,
            },
            expect.objectContaining({
              jobId: mockSnowflakeId.toString(),
            }),
          );
        });
      });

      describe('ACTIVITY 로그', () => {
        it('clientInfo가 제공되면 필요한 Cloudflare 정보만 자동으로 매핑되어야 함', async () => {
          const payload: LogJobData = {
            type: LogType.ACTIVITY,
            data: {
              userId: 'user-123',
              category: 'PAYMENT',
              action: 'DEPOSIT_REQUEST',
              metadata: { amount: 1000 },
            },
          };

          await service.dispatch(payload, mockClientInfo);

          expect(mockHeavyQueue.add).toHaveBeenCalledWith(
            'activity-log',
            {
              id: mockSnowflakeId.toString(),
              payload: {
                type: LogType.ACTIVITY,
                data: {
                  userId: 'user-123',
                  category: 'PAYMENT',
                  action: 'DEPOSIT_REQUEST',
                  metadata: { amount: 1000 },
                  sessionId: mockClientInfo.sessionId,
                  traceId: mockClientInfo.traceId,
                  country: mockClientInfo.country,
                  city: mockClientInfo.city,
                  isMobile: mockClientInfo.isMobile,
                  cfRay: mockClientInfo.cfRay,
                  ip: mockClientInfo.ip,
                },
              },
            },
            expect.objectContaining({
              jobId: mockSnowflakeId.toString(),
            }),
          );
        });
      });

      describe('ERROR 로그', () => {
        it('clientInfo가 제공되면 모든 Cloudflare 정보가 자동으로 매핑되어야 함', async () => {
          const payload: LogJobData = {
            type: LogType.ERROR,
            data: {
              errorMessage: 'Test error',
              severity: 'ERROR',
            },
          };

          await service.dispatch(payload, mockClientInfo);

          expect(mockHeavyQueue.add).toHaveBeenCalledWith(
            'error-log',
            {
              id: mockSnowflakeId.toString(),
              payload: {
                type: LogType.ERROR,
                data: {
                  errorMessage: 'Test error',
                  severity: 'ERROR',
                  country: mockClientInfo.country,
                  city: mockClientInfo.city,
                  bot: mockClientInfo.bot,
                  threat: mockClientInfo.threat,
                  isMobile: mockClientInfo.isMobile,
                  cfRay: mockClientInfo.cfRay,
                  ip: mockClientInfo.ip,
                  userAgent: mockClientInfo.userAgent,
                },
              },
            },
            expect.objectContaining({
              jobId: mockSnowflakeId.toString(),
            }),
          );
        });
      });

      describe('INTEGRATION 로그', () => {
        it('clientInfo가 제공되면 필요한 Cloudflare 정보가 자동으로 매핑되어야 함', async () => {
          const payload: LogJobData = {
            type: LogType.INTEGRATION,
            data: {
              provider: 'PAYMENT_PROVIDER',
              method: 'POST',
              endpoint: '/api/payment',
              duration: 100,
              success: true,
            },
          };

          await service.dispatch(payload, mockClientInfo);

          expect(mockCriticalQueue.add).toHaveBeenCalledWith(
            'integration-log',
            {
              id: mockSnowflakeId.toString(),
              payload: {
                type: LogType.INTEGRATION,
                data: {
                  provider: 'PAYMENT_PROVIDER',
                  method: 'POST',
                  endpoint: '/api/payment',
                  duration: 100,
                  success: true,
                  country: mockClientInfo.country,
                  city: mockClientInfo.city,
                  bot: mockClientInfo.bot,
                  threat: mockClientInfo.threat,
                  cfRay: mockClientInfo.cfRay,
                  ip: mockClientInfo.ip,
                },
              },
            },
            expect.objectContaining({
              jobId: mockSnowflakeId.toString(),
            }),
          );
        });
      });

      describe('필드 덮어쓰기', () => {
        it('payload에 이미 Cloudflare 필드가 있어도 clientInfo 값으로 덮어써야 함 (clientInfo가 더 정확한 정보)', async () => {
          const payload: LogJobData = {
            type: LogType.AUTH,
            data: {
              userId: 'user-123',
              action: 'LOGIN',
              status: 'SUCCESS',
              country: 'US', // 이미 설정된 값 (하지만 덮어씌워짐)
              city: 'New York', // 이미 설정된 값 (하지만 덮어씌워짐)
            },
          };

          await service.dispatch(payload, mockClientInfo);

          // clientInfo의 값으로 덮어쓰여짐 (clientInfo가 더 정확한 정보이므로)
          expect(mockCriticalQueue.add).toHaveBeenCalledWith(
            'auth-log',
            expect.objectContaining({
              payload: expect.objectContaining({
                data: expect.objectContaining({
                  country: mockClientInfo.country, // clientInfo 값으로 덮어씌워짐
                  city: mockClientInfo.city, // clientInfo 값으로 덮어씌워짐
                }),
              }),
            }),
            expect.any(Object),
          );
        });
      });
    });
  });
});

