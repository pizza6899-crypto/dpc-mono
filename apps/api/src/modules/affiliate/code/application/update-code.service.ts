// src/modules/affiliate/code/application/update-code.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { AffiliateCode, AffiliateCodeNotFoundException } from '../domain';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';

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
    private readonly dispatchLogService: DispatchLogService,
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

    // Audit Log 기록
    if (requestInfo) {
      await this.dispatchLogService.dispatch(
        {
          type: LogType.ACTIVITY,
          data: {
            userId: userId.toString(),
            category: 'AFFILIATE',
            action: 'AFFILIATE_CODE_UPDATE',
            metadata: {
              codeId: id,
              code: code.code,
              previousCampaignName: previousCampaignName || null,
              newCampaignName: campaignName || null,
            },
          },
        },
        requestInfo,
      );
    }

    return updatedCode;
  }
}
