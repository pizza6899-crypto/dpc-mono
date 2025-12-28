import type { Request } from 'express';
import { VerifyCredentialService } from '../../application/verify-credential.service';
import { FindLoginAttemptsService } from '../../application/find-login-attempts.service';
import { RecordLoginAttemptService } from '../../application/record-login-attempt.service';
import { CredentialPolicy } from '../../domain/policy';
import type { CredentialUserRepositoryPort } from '../../ports/out';
import type { AuthenticatedUser } from 'src/platform/auth/types/auth.types';
import { ApiException } from 'src/platform/http/exception/api.exception';
import { MessageCode } from 'src/platform/http/types';
import { HttpStatus } from '@nestjs/common';
import {
  LoginAttemptResult,
  LoginFailureReason,
} from '../../domain/model/login-attempt.entity';
import { extractClientInfo } from 'src/platform/http/utils/request-info.util';

/**
 * Credential Strategy 공통 로직
 *
 * User와 Admin Strategy에서 공통으로 사용하는 로직을 추출합니다.
 */
export class BaseCredentialStrategyLogic {
  constructor(
    private readonly verifyService: VerifyCredentialService,
    private readonly findAttemptsService: FindLoginAttemptsService,
    private readonly recordService: RecordLoginAttemptService,
    private readonly policy: CredentialPolicy,
    private readonly userRepository: CredentialUserRepositoryPort,
  ) {}

  /**
   * 로그인 검증 공통 로직
   * @param req - Express Request 객체
   * @param email - 이메일
   * @param password - 비밀번호
   * @param isAdmin - 관리자 로그인 여부
   * @returns 인증된 사용자 정보
   */
  async validateLogin(
    req: Request,
    email: string,
    password: string,
    isAdmin: boolean,
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
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        deviceFingerprint: clientInfo.fingerprint,
        isMobile: clientInfo.isMobile,
        isAdmin,
      });

      throw new ApiException(
        MessageCode.AUTH_INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
      );
    }

    return user;
  }
}

