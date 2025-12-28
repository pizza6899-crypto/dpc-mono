import { Injectable, Inject } from '@nestjs/common';
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
import type { AuthenticatedUser } from 'src/platform/auth/types/auth.types';
import { BaseCredentialStrategyLogic } from './base-credential-strategy';

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
  private readonly strategyLogic: BaseCredentialStrategyLogic;

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

    this.strategyLogic = new BaseCredentialStrategyLogic(
      this.verifyService,
      this.findAttemptsService,
      this.recordService,
      this.policy,
      this.userRepository,
    );
  }

  async validate(
    req: Request,
    email: string,
    password: string,
  ): Promise<AuthenticatedUser> {
    return this.strategyLogic.validateLogin(req, email, password, false);
  }
}
