import { Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { RecordLoginAttemptService } from './record-login-attempt.service';
import { LoginAttemptResult } from '../domain';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { CreateSessionService } from '../../session/application/create-session.service';
import { SessionType, DeviceInfo } from '../../session/domain';
import { EnvService } from 'src/infrastructure/env/env.service';

export interface LoginParams {
  user: AuthenticatedUser;
  clientInfo: RequestClientInfo;
  sessionId: string; // Express session ID
  isAdmin?: boolean;
}

/**
 * 로그인 처리 Use Case
 *
 * Passport Guard를 통해 인증된 이후의 사후 처리 및 기록을 담당합니다.
 */
@Injectable()
export class LoginService {
  private readonly logger = new Logger(LoginService.name);

  constructor(
    private readonly recordService: RecordLoginAttemptService,
    private readonly createSessionService: CreateSessionService,
    private readonly envService: EnvService,
  ) {}

  @Transactional()
  async execute({
    user,
    clientInfo,
    sessionId,
    isAdmin = false,
  }: LoginParams): Promise<void> {
    // 1. 로그인 시도 성공 기록 (Credential 도메인)
    // 이 작업이 실패하면 트랜잭션이 롤백되어야 함
    await this.recordService.execute({
      userId: user.id,
      result: LoginAttemptResult.SUCCESS,
      ipAddress: clientInfo.ip ?? null,
      userAgent: clientInfo.userAgent ?? null,
      deviceFingerprint: clientInfo.fingerprint ?? null,
      isMobile: clientInfo.isMobile ?? null,
      loginId: user.email,
      isAdmin,
    });

    // 2. HTTP 세션 생성
    const deviceInfo = DeviceInfo.create({
      ipAddress: clientInfo.ip ?? null,
      userAgent: clientInfo.userAgent ?? null,
      deviceFingerprint: clientInfo.fingerprint ?? null,
      isMobile: clientInfo.isMobile ?? null,
      os: clientInfo.os ?? null,
      browser: clientInfo.browser ?? null,
    });

    const sessionConfig = isAdmin
      ? this.envService.adminSession
      : this.envService.session;

    const expiresAt = new Date(Date.now() + sessionConfig.maxAgeMs);

    await this.createSessionService.execute({
      userId: user.id,
      sessionId,
      type: SessionType.HTTP,
      isAdmin,
      deviceInfo,
      expiresAt,
    });
  }
}
