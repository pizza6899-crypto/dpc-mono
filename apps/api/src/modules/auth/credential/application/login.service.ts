import { Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { RecordLoginAttemptService } from './record-login-attempt.service';
import { LoginAttemptResult } from '../domain';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import { CreateSessionService } from '../../session/application/create-session.service';
import { SessionType, DeviceInfo } from '../../session/domain';
import { EnvService } from 'src/common/env/env.service';

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
    private readonly dispatchLogService: DispatchLogService,
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
      email: user.email,
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

    const expiresAt = new Date(Date.now() + sessionConfig.maxAge);

    await this.createSessionService.execute({
      userId: user.id,
      sessionId,
      type: SessionType.HTTP,
      isAdmin,
      deviceInfo,
      expiresAt,
    });

    // 3. Audit 로그 기록 (보안 로그)
    try {
      await this.dispatchLogService.dispatch(
        {
          type: LogType.AUTH,
          data: {
            userId: user.id.toString(),
            action: isAdmin ? 'ADMIN_LOGIN' : 'USER_LOGIN',
            status: 'SUCCESS',
            ip: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            metadata: {
              isAdmin,
              email: user.email,
            },
          },
        },
        clientInfo,
      );
    } catch (error) {
      // Audit 로그 실패는 로그인 성공에 영향을 주지 않도록 처리
      this.logger.error(
        error,
        `Audit log 기록 실패 (로그인은 성공) - userId: ${user.id}, isAdmin: ${isAdmin}`,
      );
    }
  }
}
