import { Injectable, Inject, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { VerifyCredentialService } from './verify-credential.service';
import { RecordLoginAttemptService } from './record-login-attempt.service';
import { CredentialPolicy } from '../domain/policy';
import {
  CREDENTIAL_USER_REPOSITORY,
  LOGIN_ATTEMPT_REPOSITORY,
  type CredentialUserRepositoryPort,
  type LoginAttemptRepositoryPort,
} from '../ports/out';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import {
  AccountLockedException,
  LoginFailedException,
} from '../domain/exception';
import {
  LoginAttemptResult,
  LoginFailureReason,
} from '../domain/model/login-attempt.entity';

export interface AuthenticateIdentityParams {
  loginId: string;
  password: string;
  clientInfo: RequestClientInfo;
  isAdmin?: boolean;
}

/**
 * 사용자/관리자 통합 자격 증명 인증 Use Case
 *
 * 이메일/비밀번호를 검증하고, 계정 잠금 체크 및 실패 시도 기록을 처리합니다.
 * 트랜잭션 컨텍스트 내에서 실행되어 일관성을 보장합니다.
 */
@Injectable()
export class AuthenticateIdentityService {
  private readonly logger = new Logger(AuthenticateIdentityService.name);

  constructor(
    private readonly verifyService: VerifyCredentialService,
    private readonly recordService: RecordLoginAttemptService,
    private readonly policy: CredentialPolicy,
    @Inject(CREDENTIAL_USER_REPOSITORY)
    private readonly userRepository: CredentialUserRepositoryPort,
    @Inject(LOGIN_ATTEMPT_REPOSITORY)
    private readonly loginAttemptRepository: LoginAttemptRepositoryPort,
  ) {}

  @Transactional()
  async execute({
    loginId,
    password,
    clientInfo,
    isAdmin = false,
  }: AuthenticateIdentityParams): Promise<AuthenticatedUser> {
    // 1. 계정 잠금 체크
    const recentAttempts = await this.loginAttemptRepository.listRecent({
      loginId,
      limit: 5,
    });

    // 계정 잠금 체크 정책 적용
    if (this.policy.isAccountLocked(recentAttempts)) {
      // 계정 잠김 시도 기록
      await this.recordService.execute({
        loginId,
        result: LoginAttemptResult.FAILED,
        failureReason: LoginFailureReason.THROTTLE_LIMIT_EXCEEDED,
        ipAddress: clientInfo.ip ?? null,
        userAgent: clientInfo.userAgent ?? null,
        deviceFingerprint: clientInfo.fingerprint ?? null,
        isMobile: clientInfo.isMobile ?? null,
        isAdmin,
      });

      throw new AccountLockedException();
    }

    // 2. 자격 증명 검증 (비밀번호 체크 및 타입 검증)
    const user = await this.verifyService.execute({
      loginId,
      password,
      isAdmin,
    });

    // 3. 실패 시도 기록
    if (!user) {
      // 사용자 조회를 시도하여 userId를 얻을 수 있는지 확인 (로그 기록용)
      const foundUser = await this.userRepository.findByLoginId(loginId);

      await this.recordService.execute({
        userId: foundUser?.id || null,
        loginId,
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

      const errorMessage = isAdmin
        ? 'Invalid admin credentials'
        : 'Invalid credentials';
      throw new LoginFailedException(errorMessage);
    }

    return user;
  }
}
