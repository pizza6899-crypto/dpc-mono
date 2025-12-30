import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { ActivityLogPort } from './activity-log.port';
import { ActivityLogData, ActivityStatus } from './activity-log.types';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';

@Injectable()
export class ActivityLogAdapter implements ActivityLogPort {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    data: ActivityLogData,
    requestInfo: RequestClientInfo,
  ): Promise<void> {
    try {
      // await this.prisma.activityLog.create({
      //   data: {
      //     userId: data.userId,
      //     isAdmin: data.isAdmin ?? false,
      //     activityType: data.activityType,
      //     status: data.status,
      //     description: data.description,
      //     metadata: data.metadata,
      //     timestamp: nowUtc(),
      //     ipAddress: requestInfo.ip,
      //     userAgent: requestInfo.userAgent,
      //     browser: requestInfo.browser || 'unknown',
      //     os: requestInfo.os || 'unknown',
      //     isMobile: requestInfo.isMobile || false,
      //   },
      // });
    } catch (error) {
      // 로깅 실패는 시스템에 영향을 주지 않도록 조용히 처리
      console.error('Activity log 저장 실패:', error);
    }
  }

  async logSuccess(
    data: Omit<ActivityLogData, 'status'>,
    requestInfo: RequestClientInfo,
  ): Promise<void> {
    await this.log({ ...data, status: ActivityStatus.SUCCESS }, requestInfo);
  }

  async logFailure(
    data: Omit<ActivityLogData, 'status'>,
    requestInfo: RequestClientInfo,
  ): Promise<void> {
    await this.log({ ...data, status: ActivityStatus.FAILURE }, requestInfo);
  }
}
