// src/modules/affiliate/referral/application/find-referral-by-sub-user-id.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Referral } from '../domain';
import { REFERRAL_REPOSITORY } from '../ports/out/referral.repository.token';
import type { ReferralRepositoryPort } from '../ports/out/referral.repository.port';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';

interface FindReferralBySubUserIdParams {
  subUserId: bigint;
  requestInfo?: RequestClientInfo;
}

@Injectable()
export class FindReferralBySubUserIdService {
  constructor(
    @Inject(REFERRAL_REPOSITORY)
    private readonly repository: ReferralRepositoryPort,
    private readonly dispatchLogService: DispatchLogService,
  ) {}

  async execute({
    subUserId,
    requestInfo,
  }: FindReferralBySubUserIdParams): Promise<Referral | null> {
    const referral = await this.repository.findBySubUserId(subUserId);

    // Audit Log 기록 (피추천인이 자신의 레퍼럴 정보 조회)
    if (requestInfo && referral) {
      await this.dispatchLogService.dispatch(
        {
          type: LogType.ACTIVITY,
          data: {
            userId: subUserId.toString(),
            category: 'AFFILIATE',
            action: 'REFERRAL_SELF_VIEW',
            metadata: {
              referralId: referral.id?.toString() ?? '',
              affiliateId: referral.affiliateId.toString(),
              subUserId: subUserId.toString(),
            },
          },
        },
        requestInfo,
      );
    }

    return referral;
  }
}
