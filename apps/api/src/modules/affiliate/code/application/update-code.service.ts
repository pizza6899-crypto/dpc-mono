// src/modules/affiliate/code/application/update-code.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { AffiliateCode, AffiliateCodeNotFoundException } from '../domain';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { ACTIVITY_LOG } from 'src/common/activity-log/activity-log.token';
import type { ActivityLogPort } from 'src/common/activity-log/activity-log.port';
import { ActivityType } from 'src/common/activity-log/activity-log.types';

interface UpdateCodeParams {
  id: string;
  userId: bigint;
  campaignName?: string;
  requestInfo?: RequestClientInfo;
}

@Injectable()
export class UpdateCodeService {
  constructor(
    @Inject(AFFILIATE_CODE_REPOSITORY)
    private readonly repository: AffiliateCodeRepositoryPort,
    @Inject(ACTIVITY_LOG)
    private readonly activityLog: ActivityLogPort,
  ) {}

  async execute({
    id,
    userId,
    campaignName,
    requestInfo,
  }: UpdateCodeParams): Promise<AffiliateCode> {
    const code = await this.repository.findById(id, userId);

    if (!code) {
      throw new AffiliateCodeNotFoundException(id);
    }

    const previousCampaignName = code.campaignName;

    // 도메인 엔티티 업데이트
    code.updateCampaignName(campaignName);

    // 저장
    const updatedCode = await this.repository.update(code);

    // Activity Log 기록
    if (requestInfo) {
      await this.activityLog.logSuccess(
        {
          userId,
          activityType: ActivityType.AFFILIATE_CODE_UPDATE,
          description: `어플리에이트 코드 수정 완료 - 코드: ${code.code}, 캠페인명: ${previousCampaignName || '없음'} -> ${campaignName || '없음'}`,
          metadata: {
            codeId: id,
            code: code.code,
            previousCampaignName: previousCampaignName || null,
            newCampaignName: campaignName || null,
          },
        },
        requestInfo,
      );
    }

    return updatedCode;
  }
}
