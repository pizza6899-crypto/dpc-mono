// src/modules/affiliate/code/application/find-codes.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { AffiliateCode } from '../domain';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';

interface FindCodesParams {
  userId: bigint;
  requestInfo?: RequestClientInfo;
}

@Injectable()
export class FindCodesService {
  constructor(
    @Inject(AFFILIATE_CODE_REPOSITORY)
    private readonly repository: AffiliateCodeRepositoryPort,
    private readonly dispatchLogService: DispatchLogService,
  ) {}

  async execute({ userId, requestInfo }: FindCodesParams): Promise<{
    codes: AffiliateCode[];
    total: number;
    limit: number;
  }> {
    const codes = await this.repository.findByUserId(userId);
    const total = await this.repository.countByUserId(userId);

    // Audit Log 기록 (사용자가 자신의 코드 목록 조회)
    if (requestInfo) {
      await this.dispatchLogService.dispatch(
        {
          type: LogType.ACTIVITY,
          data: {
            userId: userId.toString(),
            category: 'AFFILIATE',
            action: 'AFFILIATE_CODE_LIST_VIEW',
            metadata: {
              userId: userId.toString(),
              count: codes.length,
              total,
            },
          },
        },
        requestInfo,
      );
    }

    return {
      codes,
      total,
      limit: 20, // MAX_CODES_PER_USER
    };
  }
}
