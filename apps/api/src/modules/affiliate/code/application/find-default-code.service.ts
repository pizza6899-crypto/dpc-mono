// src/modules/affiliate/code/application/find-default-code.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { AffiliateCode } from '../domain';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';

interface FindDefaultCodeParams {
  userId: bigint;
  requestInfo?: RequestClientInfo;
}

@Injectable()
export class FindDefaultCodeService {
  constructor(
    @Inject(AFFILIATE_CODE_REPOSITORY)
    private readonly repository: AffiliateCodeRepositoryPort,
    private readonly dispatchLogService: DispatchLogService,
  ) {}

  async execute({
    userId,
    requestInfo,
  }: FindDefaultCodeParams): Promise<AffiliateCode | null> {
    const code = await this.repository.findDefaultByUserId(userId);

    // Audit Log 기록 (사용자가 기본 코드 조회)
    if (requestInfo && code) {
      await this.dispatchLogService.dispatch(
        {
          type: LogType.ACTIVITY,
          data: {
            userId: userId.toString(),
            category: 'AFFILIATE',
            action: 'AFFILIATE_CODE_DEFAULT_VIEW',
            metadata: {
              userId: userId.toString(),
              codeId: code.id,
              code: code.code,
            },
          },
        },
        requestInfo,
      );
    }

    return code;
  }
}

