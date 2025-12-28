import { Injectable, Inject } from '@nestjs/common';
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
    await this.recordService.execute({
      userId: user.id,
      result: LoginAttemptResult.SUCCESS,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      deviceFingerprint: clientInfo.fingerprint,
      isMobile: clientInfo.isMobile,
      email: user.email,
      isAdmin,
    });

    // 2. 액티비티 로그 기록 (기존 플랫폼 기능 유지)
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
  }
}
