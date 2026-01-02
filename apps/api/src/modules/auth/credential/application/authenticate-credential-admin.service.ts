import { Injectable, Inject, HttpStatus, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { VerifyCredentialService } from './verify-credential.service';
import { FindLoginAttemptsService } from './find-login-attempts.service';
import { RecordLoginAttemptService } from './record-login-attempt.service';
import { CredentialPolicy } from '../domain/policy';
import {
  CREDENTIAL_USER_REPOSITORY,
  type CredentialUserRepositoryPort,
} from '../ports/out';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from 'src/common/http/types';
import {
  LoginAttemptResult,
  LoginFailureReason,
} from '../domain/model/login-attempt.entity';

export interface AuthenticateCredentialAdminParams {
  email: string;
  password: string;
  clientInfo: RequestClientInfo;
}

/**
 * 관리자 자격 증명 인증 Use Case
 *
 * 관리자 이메일/비밀번호를 검증하고, 계정 잠금 체크 및 실패 시도 기록을 처리합니다.
 * 트랜잭션 컨텍스트 내에서 실행되어 일관성을 보장합니다.
 */
@Injectable()
export class AuthenticateCredentialAdminService {
  private readonly logger = new Logger(AuthenticateCredentialAdminService.name);

  constructor(
    private readonly verifyService: VerifyCredentialService,
    private readonly findAttemptsService: FindLoginAttemptsService,
    private readonly recordService: RecordLoginAttemptService,
    private readonly policy: CredentialPolicy,
    @Inject(CREDENTIAL_USER_REPOSITORY)
    private readonly userRepository: CredentialUserRepositoryPort,
  ) {}

  @Transactional()
  async execute({
    email,
    password,
    clientInfo,
  }: AuthenticateCredentialAdminParams): Promise<AuthenticatedUser> {
    // 1. 계정 잠금 체크
    const recentAttempts = await this.findAttemptsService.execute({
      email,
      limit: 5,
    });

    if (this.policy.isAccountLocked(recentAttempts)) {
      // 계정 잠김 시도 기록
      await this.recordService.execute({
        email,
        result: LoginAttemptResult.FAILED,
        failureReason: LoginFailureReason.THROTTLE_LIMIT_EXCEEDED,
        ipAddress: clientInfo.ip ?? null,
        userAgent: clientInfo.userAgent ?? null,
        deviceFingerprint: clientInfo.fingerprint ?? null,
        isMobile: clientInfo.isMobile ?? null,
        isAdmin: true,
      });

      throw new ApiException(
        MessageCode.THROTTLE_TOO_MANY_REQUESTS,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 2. 자격 증명 검증 (관리자)
    const user = await this.verifyService.execute({
      email,
      password,
      isAdmin: true,
    });

    // 3. 실패 시도 기록
    if (!user) {
      // 사용자 조회를 시도하여 userId를 얻을 수 있는지 확인
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
        isAdmin: true,
      });

      throw new ApiException(
        MessageCode.AUTH_INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
      );
    }

    return user;
  }
}

