// src/modules/affiliate/referral/application/find-referral-by-id.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Referral } from '../domain';
import { REFERRAL_REPOSITORY } from '../ports/out/referral.repository.token';
import type { ReferralRepositoryPort } from '../ports/out/referral.repository.port';
import { ReferralNotFoundException } from '../domain/referral.exception';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';

interface FindReferralByIdParams {
  id: string;
  userId?: bigint; // 조회하는 사용자 ID (Audit Log용)
  requestInfo?: RequestClientInfo;
}

@Injectable()
export class FindReferralByIdService {
  constructor(
    @Inject(REFERRAL_REPOSITORY)
    private readonly repository: ReferralRepositoryPort,
    private readonly dispatchLogService: DispatchLogService,
  ) {}

  async execute({
    id,
    userId,
    requestInfo,
  }: FindReferralByIdParams): Promise<Referral> {
    const referral = await this.repository.findById(id);
    if (!referral) {
      throw new ReferralNotFoundException(id);
    }

    // Audit Log 기록 (사용자가 레퍼럴 상세 조회)
    if (requestInfo && userId) {
      await this.dispatchLogService.dispatch(
        {
          type: LogType.ACTIVITY,
          data: {
            userId: userId.toString(),
            category: 'AFFILIATE',
            action: 'REFERRAL_DETAIL_VIEW',
            metadata: {
              referralId: id,
              affiliateId: referral.affiliateId.toString(),
              subUserId: referral.subUserId.toString(),
            },
          },
        },
        requestInfo,
      );
    }

    return referral;
  }
}
