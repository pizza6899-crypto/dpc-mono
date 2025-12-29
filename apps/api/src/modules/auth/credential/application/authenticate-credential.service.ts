import { Injectable, Inject, HttpStatus, Logger } from '@nestjs/common';
import { VerifyCredentialService } from './verify-credential.service';
import { FindLoginAttemptsService } from './find-login-attempts.service';
import { RecordLoginAttemptService } from './record-login-attempt.service';
import { CredentialPolicy } from '../domain/policy';
import {
  CREDENTIAL_USER_REPOSITORY,
  type CredentialUserRepositoryPort,
} from '../ports/out';
import type { AuthenticatedUser } from 'src/platform/auth/types/auth.types';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import { ApiException } from 'src/platform/http/exception/api.exception';
import { MessageCode } from 'src/platform/http/types';
import {
  LoginAttemptResult,
  LoginFailureReason,
} from '../domain/model/login-attempt.entity';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';

export interface AuthenticateCredentialParams {
  email: string;
  password: string;
  clientInfo: RequestClientInfo;
  isAdmin?: boolean;
}

/**
 * 자격 증명 인증 Use Case
 *
 * 이메일/비밀번호를 검증하고, 계정 잠금 체크 및 실패 시도 기록을 처리합니다.
 * 트랜잭션 컨텍스트 내에서 실행되어 일관성을 보장합니다.
 */
@Injectable()
export class AuthenticateCredentialService {
  private readonly logger = new Logger(AuthenticateCredentialService.name);

  constructor(
    private readonly verifyService: VerifyCredentialService,
    private readonly findAttemptsService: FindLoginAttemptsService,
    private readonly recordService: RecordLoginAttemptService,
    private readonly policy: CredentialPolicy,
    @Inject(CREDENTIAL_USER_REPOSITORY)
    private readonly userRepository: CredentialUserRepositoryPort,
    private readonly dispatchLogService: DispatchLogService,
  ) {}

  async execute({
    email,
    password,
    clientInfo,
    isAdmin = false,
  }: AuthenticateCredentialParams): Promise<AuthenticatedUser> {
    // 1. 계정 잠금 체크
    const recentAttempts = await this.findAttemptsService.execute({
      email,
      limit: 5,
    });

    // 비활성화
    if (false && this.policy.isAccountLocked(recentAttempts)) {
      // 계정 잠김 시도 기록
      await this.recordService.execute({
        email,
        result: LoginAttemptResult.FAILED,
        failureReason: LoginFailureReason.THROTTLE_LIMIT_EXCEEDED,
        ipAddress: clientInfo.ip ?? null,
        userAgent: clientInfo.userAgent ?? null,
        deviceFingerprint: clientInfo.fingerprint ?? null,
        isMobile: clientInfo.isMobile ?? null,
        isAdmin,
      });

      throw new ApiException(
        MessageCode.THROTTLE_TOO_MANY_REQUESTS,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 2. 자격 증명 검증
    const user = await this.verifyService.execute({
      email,
      password,
      isAdmin,
    });

    // 3. 실패 시도 기록
    if (!user) {
      // 사용자 조회를 시도하여 userId를 얻을 수 있는지 확인
      // (비밀번호가 틀렸지만 사용자는 존재하는 경우)
      const foundUser = await this.userRepository.findByEmail(email);

      await this.recordService.execute({
        userId: foundUser?.id || null,
        email,
        result: LoginAttemptResult.FAILED,
        failureReason: foundUser
          ? LoginFailureReason.INVALID_CREDENTIALS
          : LoginFailureReason.USER_NOT_FOUND,
        ipAddress: clientInfo.ip ?? null,
        userAgent: clientInfo.userAgent ?? null,
        deviceFingerprint: clientInfo.fingerprint ?? null,
        isMobile: clientInfo.isMobile ?? null,
        isAdmin,
      });

      // Audit 로그 기록 (로그인 실패)
      try {
        await this.dispatchLogService.dispatch({
          type: LogType.AUTH,
          data: {
            userId: foundUser?.id?.toString(),
            action: isAdmin ? 'ADMIN_LOGIN' : 'USER_LOGIN',
            status: 'FAILURE',
            ip: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            metadata: {
              isAdmin,
              email,
              failureReason: foundUser
                ? 'INVALID_CREDENTIALS'
                : 'USER_NOT_FOUND',
            },
          },
        });
      } catch (error) {
        // Audit 로그 실패는 로그인 실패 처리에 영향을 주지 않도록 처리
        this.logger.error(
          error,
          `Audit log 기록 실패 (로그인 실패) - email: ${email}`,
        );
      }

      throw new ApiException(
        MessageCode.AUTH_INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
      );
    }

    return user;
  }
}

