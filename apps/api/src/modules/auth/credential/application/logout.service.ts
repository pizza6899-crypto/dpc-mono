import { Injectable, Inject } from '@nestjs/common';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import { ActivityType } from 'src/platform/activity-log/activity-log.types';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';

export interface LogoutParams {
  userId: string;
  clientInfo: RequestClientInfo;
  isAdmin?: boolean;
}

/**
 * 로그아웃 처리 Use Case
 */
@Injectable()
export class LogoutService {
  constructor(
    @Inject(ACTIVITY_LOG) private readonly activityLog: ActivityLogPort,
  ) {}

  async execute({
    userId,
    clientInfo,
    isAdmin = false,
  }: LogoutParams): Promise<void> {
    // 액티비티 로그 기록
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
  }
}
