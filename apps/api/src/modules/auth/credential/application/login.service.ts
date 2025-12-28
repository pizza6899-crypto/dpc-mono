import { Injectable, Inject, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { RecordLoginAttemptService } from './record-login-attempt.service';
import { LoginAttemptResult } from '../domain';
import type { AuthenticatedUser } from 'src/platform/auth/types/auth.types';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { ActivityType } from 'src/platform/activity-log/activity-log.types';

export interface LoginParams {
  user: AuthenticatedUser;
  clientInfo: RequestClientInfo;
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
    @Inject(ACTIVITY_LOG) private readonly activityLog: ActivityLogPort,
  ) {}

  @Transactional()
  async execute({
    user,
    clientInfo,
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

    // 2. 액티비티 로그 기록 (기존 플랫폼 기능 유지)
    // 주의: ActivityLogAdapter가 내부에서 에러를 조용히 처리하므로
    // 트랜잭션 롤백이 되지 않을 수 있습니다.
    // 액티비티 로그는 부가 기능이므로 실패해도 로그인은 성공 처리됩니다.
    try {
      await this.activityLog.logSuccess(
        {
          userId: user.id,
          activityType: isAdmin
            ? ActivityType.ADMIN_LOGIN
            : ActivityType.USER_LOGIN,
          description: `${isAdmin ? 'Admin' : 'User'} logged in successfully`,
        },
        clientInfo,
      );
    } catch (error) {
      // 액티비티 로그 실패는 로그인 성공에 영향을 주지 않도록 처리
      // 하지만 에러는 로깅하여 모니터링 가능하도록 함
      this.logger.error(
        error,
        `Activity log 기록 실패 (로그인은 성공) - userId: ${user.id}, isAdmin: ${isAdmin}`,
      );
    }
  }
}
