// src/modules/auth/credential/application/record-login-attempt.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { RecordLoginAttemptService } from './record-login-attempt.service';
import {
  LOGIN_ATTEMPT_REPOSITORY,
  type LoginAttemptRepositoryPort,
} from '../ports/out';
import {
  LoginAttempt,
  LoginAttemptResult,
  LoginFailureReason,
} from '../domain';

describe('RecordLoginAttemptService', () => {
  let service: RecordLoginAttemptService;
  let repository: jest.Mocked<LoginAttemptRepositoryPort>;

  const mockUserId = 'user-123';
  const mockEmail = 'user@example.com';
  const mockIpAddress = '192.168.1.1';
  const mockUserAgent = 'Mozilla/5.0';
  const mockFingerprint = 'fingerprint-123';
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
        RecordLoginAttemptService,
        {
          provide: LOGIN_ATTEMPT_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<RecordLoginAttemptService>(RecordLoginAttemptService);
    repository = module.get(LOGIN_ATTEMPT_REPOSITORY);
  });

  describe('execute', () => {
    describe('성공한 로그인 시도', () => {
      it('SUCCESS result와 userId가 있으면 성공 시도로 기록한다', async () => {
        // Arrange
        const mockAttempt = LoginAttempt.createSuccess({
          uid: 'uid-123',
          userId: mockUserId,
          ipAddress: mockIpAddress,
          userAgent: mockUserAgent,
          deviceFingerprint: mockFingerprint,
          isMobile: false,
          email: mockEmail,
          isAdmin: false,
        });

        repository.create.mockResolvedValue(mockAttempt);

        // Act
        const result = await service.execute({
          userId: mockUserId,
          result: LoginAttemptResult.SUCCESS,
          ipAddress: mockIpAddress,
          userAgent: mockUserAgent,
          deviceFingerprint: mockFingerprint,
          isMobile: false,
          email: mockEmail,
          isAdmin: false,
        });

        // Assert
        expect(result).toEqual(mockAttempt);
        expect(repository.create).toHaveBeenCalledTimes(1);
        const createdAttempt = repository.create.mock.calls[0][0];
        expect(createdAttempt.result).toBe(LoginAttemptResult.SUCCESS);
        expect(createdAttempt.userId).toBe(mockUserId);
        expect(createdAttempt.failureReason).toBeNull();
      });

      it('관리자 로그인 성공 시도도 기록한다', async () => {
        // Arrange
        const mockAttempt = LoginAttempt.createSuccess({
          uid: 'uid-123',
          userId: mockUserId,
          email: mockEmail,
          isAdmin: true,
        });

        repository.create.mockResolvedValue(mockAttempt);

        // Act
        await service.execute({
          userId: mockUserId,
          result: LoginAttemptResult.SUCCESS,
          email: mockEmail,
          isAdmin: true,
        });

        // Assert
        const createdAttempt = repository.create.mock.calls[0][0];
        expect(createdAttempt.isAdmin).toBe(true);
        expect(createdAttempt.result).toBe(LoginAttemptResult.SUCCESS);
      });

      it('SUCCESS인데 userId가 없으면 실패로 처리한다', async () => {
        // Arrange
        const mockAttempt = LoginAttempt.createFailure({
          uid: 'uid-123',
          failureReason: LoginFailureReason.UNKNOWN,
          email: mockEmail,
        });

        repository.create.mockResolvedValue(mockAttempt);

        // Act
        await service.execute({
          result: LoginAttemptResult.SUCCESS,
          email: mockEmail,
        });

        // Assert
        const createdAttempt = repository.create.mock.calls[0][0];
        expect(createdAttempt.result).toBe(LoginAttemptResult.FAILED);
        expect(createdAttempt.failureReason).toBe(LoginFailureReason.UNKNOWN);
      });

      it('선택적 필드가 없어도 성공 시도를 기록한다', async () => {
        // Arrange
        const mockAttempt = LoginAttempt.createSuccess({
          uid: 'uid-123',
          userId: mockUserId,
        });

        repository.create.mockResolvedValue(mockAttempt);

        // Act
        await service.execute({
          userId: mockUserId,
          result: LoginAttemptResult.SUCCESS,
        });

        // Assert
        const createdAttempt = repository.create.mock.calls[0][0];
        expect(createdAttempt.result).toBe(LoginAttemptResult.SUCCESS);
        expect(createdAttempt.userId).toBe(mockUserId);
      });
    });

    describe('실패한 로그인 시도', () => {
      it('FAILED result로 실패 시도를 기록한다', async () => {
        // Arrange
        const mockAttempt = LoginAttempt.createFailure({
          uid: 'uid-123',
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          ipAddress: mockIpAddress,
        });

        repository.create.mockResolvedValue(mockAttempt);

        // Act
        const result = await service.execute({
          result: LoginAttemptResult.FAILED,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          ipAddress: mockIpAddress,
        });

        // Assert
        expect(result).toEqual(mockAttempt);
        const createdAttempt = repository.create.mock.calls[0][0];
        expect(createdAttempt.result).toBe(LoginAttemptResult.FAILED);
        expect(createdAttempt.failureReason).toBe(
          LoginFailureReason.INVALID_CREDENTIALS,
        );
      });

      it('failureReason이 없으면 UNKNOWN을 사용한다', async () => {
        // Arrange
        const mockAttempt = LoginAttempt.createFailure({
          uid: 'uid-123',
          failureReason: LoginFailureReason.UNKNOWN,
          email: mockEmail,
        });

        repository.create.mockResolvedValue(mockAttempt);

        // Act
        await service.execute({
          result: LoginAttemptResult.FAILED,
          email: mockEmail,
        });

        // Assert
        const createdAttempt = repository.create.mock.calls[0][0];
        expect(createdAttempt.failureReason).toBe(LoginFailureReason.UNKNOWN);
      });

      it('실패 시도에도 userId를 기록할 수 있다', async () => {
        // Arrange
        const mockAttempt = LoginAttempt.createFailure({
          uid: 'uid-123',
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          userId: mockUserId,
          email: mockEmail,
        });

        repository.create.mockResolvedValue(mockAttempt);

        // Act
        await service.execute({
          userId: mockUserId,
          result: LoginAttemptResult.FAILED,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
        });

        // Assert
        const createdAttempt = repository.create.mock.calls[0][0];
        expect(createdAttempt.userId).toBe(mockUserId);
        expect(createdAttempt.result).toBe(LoginAttemptResult.FAILED);
      });

      it('다양한 실패 이유로 실패 시도를 기록한다', async () => {
        const failureReasons = [
          LoginFailureReason.INVALID_CREDENTIALS,
          LoginFailureReason.USER_NOT_FOUND,
          LoginFailureReason.ACCOUNT_SUSPENDED,
          LoginFailureReason.ACCOUNT_CLOSED,
          LoginFailureReason.THROTTLE_LIMIT_EXCEEDED,
        ];

        for (const reason of failureReasons) {
          const mockAttempt = LoginAttempt.createFailure({
            uid: 'uid-123',
            failureReason: reason,
            email: mockEmail,
          });

          repository.create.mockResolvedValue(mockAttempt);

          await service.execute({
            result: LoginAttemptResult.FAILED,
            failureReason: reason,
            email: mockEmail,
          });

          const createdAttempt = repository.create.mock.calls[
            repository.create.mock.calls.length - 1
          ][0];
          expect(createdAttempt.failureReason).toBe(reason);
        }
      });
    });

    describe('엣지 케이스', () => {
      it('모든 선택적 필드가 null이어도 기록한다', async () => {
        // Arrange
        const mockAttempt = LoginAttempt.createFailure({
          uid: 'uid-123',
          failureReason: LoginFailureReason.UNKNOWN,
        });

        repository.create.mockResolvedValue(mockAttempt);

        // Act
        await service.execute({
          result: LoginAttemptResult.FAILED,
          userId: null,
          failureReason: null,
          ipAddress: null,
          userAgent: null,
          deviceFingerprint: null,
          isMobile: null,
          email: null,
        });

        // Assert
        expect(repository.create).toHaveBeenCalledTimes(1);
        const createdAttempt = repository.create.mock.calls[0][0];
        expect(createdAttempt.result).toBe(LoginAttemptResult.FAILED);
        expect(createdAttempt.failureReason).toBe(LoginFailureReason.UNKNOWN);
      });

      it('모바일 기기에서의 로그인 시도를 기록한다', async () => {
        // Arrange
        const mockAttempt = LoginAttempt.createSuccess({
          uid: 'uid-123',
          userId: mockUserId,
          isMobile: true,
        });

        repository.create.mockResolvedValue(mockAttempt);

        // Act
        await service.execute({
          userId: mockUserId,
          result: LoginAttemptResult.SUCCESS,
          isMobile: true,
        });

        // Assert
        const createdAttempt = repository.create.mock.calls[0][0];
        expect(createdAttempt.isMobile).toBe(true);
      });

      it('repository.create가 실패하면 예외를 전파한다', async () => {
        // Arrange
        const error = new Error('Database error');
        repository.create.mockRejectedValue(error);

        // Act & Assert
        await expect(
          service.execute({
            userId: mockUserId,
            result: LoginAttemptResult.SUCCESS,
          }),
        ).rejects.toThrow('Database error');
      });
    });
  });
});

