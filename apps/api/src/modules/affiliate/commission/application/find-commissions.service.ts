// src/modules/affiliate/commission/application/find-commissions.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { CommissionStatus, ExchangeCurrencyCode } from '@repo/database';
import { AffiliateCommission } from '../domain';
import { AFFILIATE_COMMISSION_REPOSITORY } from '../ports/out/affiliate-commission.repository.token';
import type { AffiliateCommissionRepositoryPort } from '../ports/out/affiliate-commission.repository.port';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';

interface FindCommissionsParams {
  affiliateId: bigint;
  options?: {
    status?: CommissionStatus;
    currency?: ExchangeCurrencyCode;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  };
  requestInfo?: RequestClientInfo;
}

@Injectable()
export class FindCommissionsService {
  private readonly logger = new Logger(FindCommissionsService.name);

  constructor(
    @Inject(AFFILIATE_COMMISSION_REPOSITORY)
    private readonly repository: AffiliateCommissionRepositoryPort,
    private readonly dispatchLogService: DispatchLogService,
  ) {}

  async execute({
    affiliateId,
    options,
    requestInfo,
  }: FindCommissionsParams): Promise<AffiliateCommission[]> {
    try {
      const commissions = await this.repository.findByAffiliateId(
        affiliateId,
        options,
      );

      // Audit Log 기록 (사용자가 커미션 목록 조회)
      if (requestInfo) {
        await this.dispatchLogService.dispatch(
          {
            type: LogType.ACTIVITY,
            data: {
              userId: affiliateId.toString(),
              category: 'AFFILIATE',
              action: 'COMMISSION_LIST_VIEW',
              metadata: {
                affiliateId: affiliateId.toString(),
                count: commissions.length,
                options: {
                  status: options?.status,
                  currency: options?.currency,
                  startDate: options?.startDate?.toISOString(),
                  endDate: options?.endDate?.toISOString(),
                  limit: options?.limit,
                  offset: options?.offset,
                },
              },
            },
          },
          requestInfo,
        );
      }

      return commissions;
    } catch (error) {
      this.logger.error(
        `커미션 목록 조회 실패 - affiliateId: ${affiliateId}, options: ${JSON.stringify(options)}`,
        error,
      );
      throw error;
    }
  }
}
