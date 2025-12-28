import { Injectable, HttpStatus, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import type { Request } from 'express';
import { VerifyCredentialService } from '../../application/verify-credential.service';
import { FindLoginAttemptsService } from '../../application/find-login-attempts.service';
import { RecordLoginAttemptService } from '../../application/record-login-attempt.service';
import { CredentialPolicy } from '../../domain/policy';
import {
  CREDENTIAL_USER_REPOSITORY,
  type CredentialUserRepositoryPort,
} from '../../ports/out';
import { AuthenticatedUser } from 'src/platform/auth/types/auth.types';
import { ApiException } from 'src/platform/http/exception/api.exception';
import { MessageCode } from 'src/platform/http/types';
import {
  LoginAttemptResult,
  LoginFailureReason,
} from '../../domain/model/login-attempt.entity';
import { extractClientInfo } from 'src/platform/http/utils/request-info.util';

/**
 * Credential 모듈 전용 Local 전략 (User)
 *
 * VerifyCredentialService를 사용하여 이메일/비밀번호를 검증합니다.
 * 계정 잠금 정책 및 실패 시도 기록을 처리합니다.
 */
@Injectable()
export class CredentialLocalStrategy extends PassportStrategy(
  Strategy,
  'credential-local',
) {
  constructor(
    private readonly verifyService: VerifyCredentialService,
    private readonly findAttemptsService: FindLoginAttemptsService,
    private readonly recordService: RecordLoginAttemptService,
    private readonly policy: CredentialPolicy,
    @Inject(CREDENTIAL_USER_REPOSITORY)
    private readonly userRepository: CredentialUserRepositoryPort,
  ) {
    super({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true, // request 객체를 validate에 전달
    });
  }

  async validate(
    req: Request,
    email: string,
    password: string,
  ): Promise<AuthenticatedUser> {
    const clientInfo = extractClientInfo(req);

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
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        deviceFingerprint: clientInfo.fingerprint,
        isMobile: clientInfo.isMobile,
        isAdmin: false,
      });

      throw new ApiException(
        MessageCode.THROTTLE_TOO_MANY_REQUESTS,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 2. 자격 증명 검증
    const user = await this.verifyService.execute({ email, password });

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
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        deviceFingerprint: clientInfo.fingerprint,
        isMobile: clientInfo.isMobile,
        isAdmin: false,
      });

      throw new ApiException(
        MessageCode.AUTH_INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
      );
    }

    return user;
  }
}
