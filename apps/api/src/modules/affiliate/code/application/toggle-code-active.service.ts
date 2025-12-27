// src/modules/affiliate/code/application/toggle-code-active.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { AffiliateCode, AffiliateCodeNotFoundException } from '../domain';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { ActivityType } from 'src/platform/activity-log/activity-log.types';

interface ToggleCodeActiveParams {
  id: string;
  userId: string;
  requestInfo?: RequestClientInfo;
}

@Injectable()
export class ToggleCodeActiveService {
  constructor(
    @Inject(AFFILIATE_CODE_REPOSITORY)
    private readonly repository: AffiliateCodeRepositoryPort,
    @Inject(ACTIVITY_LOG)
    private readonly activityLog: ActivityLogPort,
  ) {}

  async execute({
    id,
    userId,
    requestInfo,
  }: ToggleCodeActiveParams): Promise<AffiliateCode> {
    const code = await this.repository.findById(id, userId);

    if (!code) {
      throw new AffiliateCodeNotFoundException(id);
    }

    const previousActive = code.isActive;

    // 도메인 엔티티 업데이트
    code.toggleActive();

    // 저장
    const updatedCode = await this.repository.update(code);

    // Activity Log 기록
    if (requestInfo) {
      await this.activityLog.logSuccess(
        {
          userId,
          activityType: ActivityType.AFFILIATE_CODE_TOGGLE_ACTIVE,
          description: `어플리에이트 코드 활성화 상태 변경 - 코드: ${code.code}, ${previousActive ? '활성' : '비활성'} -> ${updatedCode.isActive ? '활성' : '비활성'}`,
          metadata: {
            codeId: id,
            code: code.code,
            previousActive,
            newActive: updatedCode.isActive,
          },
        },
        requestInfo,
      );
    }

    return updatedCode;
  }
}
