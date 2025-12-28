// src/modules/auth/credential/application/find-login-attempts.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { FindLoginAttemptsService } from './find-login-attempts.service';
import {
  LOGIN_ATTEMPT_REPOSITORY,
  type LoginAttemptRepositoryPort,
} from '../ports/out';
import {
  LoginAttempt,
  LoginAttemptResult,
  LoginFailureReason,
} from '../domain';

describe('FindLoginAttemptsService', () => {
  let service: FindLoginAttemptsService;
  let repository: jest.Mocked<LoginAttemptRepositoryPort>;

  const mockUid = 'clx1234567890';
  const mockUserId = 'user-123';
  const mockEmail = 'user@example.com';
  const mockIpAddress = '192.168.1.1';
  const baseDate = new Date('2024-01-01T00:00:00Z');

  beforeEach(async () => {
    const mockRepository: jest.Mocked<LoginAttemptRepositoryPort> = {
      create: jest.fn(),
      findByUid: jest.fn(),
      getByUid: jest.fn(),
      findById: jest.fn(),
      getById: jest.fn(),
      listRecent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindLoginAttemptsService,
        {
          provide: LOGIN_ATTEMPT_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<FindLoginAttemptsService>(FindLoginAttemptsService);
    repository = module.get(LOGIN_ATTEMPT_REPOSITORY);
  });

  describe('execute', () => {
    it('email로 로그인 시도를 조회한다', async () => {
      const mockAttempts = [
        LoginAttempt.createFailure({
          uid: mockUid,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          attemptedAt: baseDate,
        }),
      ];

      repository.listRecent.mockResolvedValue(mockAttempts);

      const result = await service.execute({
        email: mockEmail,
        limit: 10,
      });

      expect(result).toEqual(mockAttempts);
      expect(repository.listRecent).toHaveBeenCalledWith({
        email: mockEmail,
        ipAddress: undefined,
        limit: 10,
      });
    });

    it('ipAddress로 로그인 시도를 조회한다', async () => {
      const mockAttempts = [
        LoginAttempt.createFailure({
          uid: mockUid,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          ipAddress: mockIpAddress,
          attemptedAt: baseDate,
        }),
      ];

      repository.listRecent.mockResolvedValue(mockAttempts);

      const result = await service.execute({
        ipAddress: mockIpAddress,
        limit: 20,
      });

      expect(result).toEqual(mockAttempts);
      expect(repository.listRecent).toHaveBeenCalledWith({
        email: undefined,
        ipAddress: mockIpAddress,
        limit: 20,
      });
    });

    it('email과 ipAddress 모두로 로그인 시도를 조회한다', async () => {
      const mockAttempts = [
        LoginAttempt.createFailure({
          uid: mockUid,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          ipAddress: mockIpAddress,
          attemptedAt: baseDate,
        }),
      ];

      repository.listRecent.mockResolvedValue(mockAttempts);

      const result = await service.execute({
        email: mockEmail,
        ipAddress: mockIpAddress,
        limit: 30,
      });

      expect(result).toEqual(mockAttempts);
      expect(repository.listRecent).toHaveBeenCalledWith({
        email: mockEmail,
        ipAddress: mockIpAddress,
        limit: 30,
      });
    });

    it('limit가 없으면 기본값 50을 사용한다', async () => {
      const mockAttempts: LoginAttempt[] = [];
      repository.listRecent.mockResolvedValue(mockAttempts);

      await service.execute({
        email: mockEmail,
      });

      expect(repository.listRecent).toHaveBeenCalledWith({
        email: mockEmail,
        ipAddress: undefined,
        limit: 50,
      });
    });

    it('email과 ipAddress가 모두 없으면 BadRequestException을 발생시킨다', async () => {
      await expect(
        service.execute({
          limit: 10,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(repository.listRecent).not.toHaveBeenCalled();
    });

    it('limit가 0보다 작으면 BadRequestException을 발생시킨다', async () => {
      await expect(
        service.execute({
          email: mockEmail,
          limit: 0,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.execute({
          email: mockEmail,
          limit: -1,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(repository.listRecent).not.toHaveBeenCalled();
    });

    it('limit가 100보다 크면 BadRequestException을 발생시킨다', async () => {
      await expect(
        service.execute({
          email: mockEmail,
          limit: 101,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.execute({
          email: mockEmail,
          limit: 1000,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(repository.listRecent).not.toHaveBeenCalled();
    });

    it('limit가 정수가 아니면 BadRequestException을 발생시킨다', async () => {
      await expect(
        service.execute({
          email: mockEmail,
          limit: 10.5,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(repository.listRecent).not.toHaveBeenCalled();
    });

    it('유효한 limit 범위 내에서 조회한다', async () => {
      const mockAttempts: LoginAttempt[] = [];
      repository.listRecent.mockResolvedValue(mockAttempts);

      // 최소값
      await service.execute({
        email: mockEmail,
        limit: 1,
      });
      expect(repository.listRecent).toHaveBeenCalledWith({
        email: mockEmail,
        ipAddress: undefined,
        limit: 1,
      });

      // 최대값
      await service.execute({
        email: mockEmail,
        limit: 100,
      });
      expect(repository.listRecent).toHaveBeenCalledWith({
        email: mockEmail,
        ipAddress: undefined,
        limit: 100,
      });
    });

    it('빈 문자열 email은 undefined로 정규화된다', async () => {
      const mockAttempts: LoginAttempt[] = [];
      repository.listRecent.mockResolvedValue(mockAttempts);

      await service.execute({
        email: '',
        ipAddress: mockIpAddress,
      });

      expect(repository.listRecent).toHaveBeenCalledWith({
        email: undefined,
        ipAddress: mockIpAddress,
        limit: 50,
      });
    });

    it('빈 문자열 ipAddress는 undefined로 정규화된다', async () => {
      const mockAttempts: LoginAttempt[] = [];
      repository.listRecent.mockResolvedValue(mockAttempts);

      await service.execute({
        email: mockEmail,
        ipAddress: '',
      });

      expect(repository.listRecent).toHaveBeenCalledWith({
        email: mockEmail,
        ipAddress: undefined,
        limit: 50,
      });
    });

    it('공백만 있는 문자열은 undefined로 정규화된다', async () => {
      const mockAttempts: LoginAttempt[] = [];
      repository.listRecent.mockResolvedValue(mockAttempts);

      await service.execute({
        email: '   ',
        ipAddress: mockIpAddress,
      });

      expect(repository.listRecent).toHaveBeenCalledWith({
        email: undefined,
        ipAddress: mockIpAddress,
        limit: 50,
      });
    });

    it('email과 ipAddress가 모두 빈 문자열이면 BadRequestException을 발생시킨다', async () => {
      await expect(
        service.execute({
          email: '',
          ipAddress: '',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(repository.listRecent).not.toHaveBeenCalled();
    });
  });
});

