// src/modules/affiliate/referral/application/find-referrals-by-affiliate-id.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Referral } from '../domain';
import { REFERRAL_REPOSITORY } from '../ports/out/referral.repository.token';
import type { ReferralRepositoryPort } from '../ports/out/referral.repository.port';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';

interface FindReferralsByAffiliateIdParams {
  affiliateId: bigint;
  requestInfo?: RequestClientInfo;
}

@Injectable()
export class FindReferralsByAffiliateIdService {
  constructor(
    @Inject(REFERRAL_REPOSITORY)
    private readonly repository: ReferralRepositoryPort,
    private readonly dispatchLogService: DispatchLogService,
  ) {}

  async execute({
    affiliateId,
    requestInfo,
  }: FindReferralsByAffiliateIdParams): Promise<Referral[]> {
    const referrals = await this.repository.findByAffiliateId(affiliateId);

    // Audit Log 기록 (어필리에이트가 자신의 레퍼럴 목록 조회)
    if (requestInfo) {
      await this.dispatchLogService.dispatch(
        {
          type: LogType.ACTIVITY,
          data: {
            userId: affiliateId.toString(),
            category: 'AFFILIATE',
            action: 'REFERRAL_LIST_VIEW',
            metadata: {
              affiliateId: affiliateId.toString(),
              count: referrals.length,
            },
          },
        },
        requestInfo,
      );
    }

    return referrals;
  }
}
