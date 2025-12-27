// src/modules/affiliate/code/application/delete-code.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { AffiliateCodeNotFoundException, AffiliateCodePolicy } from '../domain';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { ActivityType } from 'src/platform/activity-log/activity-log.types';

interface DeleteCodeParams {
  id: string;
  userId: string;
  requestInfo?: RequestClientInfo;
}

@Injectable()
export class DeleteCodeService {
  constructor(
    @Inject(AFFILIATE_CODE_REPOSITORY)
    private readonly repository: AffiliateCodeRepositoryPort,
    private readonly policy: AffiliateCodePolicy,
    @Inject(ACTIVITY_LOG)
    private readonly activityLog: ActivityLogPort,
  ) {}

  async execute({ id, userId, requestInfo }: DeleteCodeParams): Promise<void> {
    const code = await this.repository.findById(id, userId);

    if (!code) {
      throw new AffiliateCodeNotFoundException(id);
    }

    // 전체 코드 개수 조회
    const totalCodes = await this.repository.countByUserId(userId);

    // 삭제 가능 여부 검증
    this.policy.canDeleteCode(code, totalCodes);

    const codeValue = code.code;
    const campaignName = code.campaignName;

    // 삭제
    await this.repository.delete(id, userId);

    // Activity Log 기록
    if (requestInfo) {
      await this.activityLog.logSuccess(
        {
          userId,
          activityType: ActivityType.AFFILIATE_CODE_DELETE,
          description: `어플리에이트 코드 삭제 완료 - 코드: ${codeValue}, 캠페인명: ${campaignName || '없음'}`,
          metadata: {
            codeId: id,
            code: codeValue,
            campaignName: campaignName || null,
          },
        },
        requestInfo,
      );
    }
  }
}
