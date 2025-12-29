import { Injectable, Inject, Logger } from '@nestjs/common';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import { ActivityType } from 'src/platform/activity-log/activity-log.types';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';

export interface LogoutParams {
  userId?: bigint;
  clientInfo: RequestClientInfo;
  isAdmin?: boolean;
}

/**
 * 로그아웃 처리 Use Case
 */
@Injectable()
export class LogoutService {
  private readonly logger = new Logger(LogoutService.name);

  constructor(
    @Inject(ACTIVITY_LOG) private readonly activityLog: ActivityLogPort,
  ) {}

  async execute({
    userId,
    clientInfo,
    isAdmin = false,
  }: LogoutParams): Promise<void> {
    // userId가 있는 경우에만 액티비티 로그 기록
    // 액티비티 로그는 부가 기능이므로 실패해도 로그아웃은 성공 처리됩니다.
    if (userId) {
      try {
        await this.activityLog.logSuccess(
          {
            userId,
            activityType: isAdmin
              ? ActivityType.ADMIN_LOGOUT
              : ActivityType.USER_LOGOUT,
            description: `${isAdmin ? 'Admin' : 'User'} logged out`,
          },
          clientInfo,
        );
      } catch (error) {
        // 액티비티 로그 실패는 로그아웃 성공에 영향을 주지 않도록 처리
        // 하지만 에러는 로깅하여 모니터링 가능하도록 함
        this.logger.error(
          error,
          `Activity log 기록 실패 (로그아웃은 성공) - userId: ${userId}, isAdmin: ${isAdmin}`,
        );
      }
    }
  }
}
