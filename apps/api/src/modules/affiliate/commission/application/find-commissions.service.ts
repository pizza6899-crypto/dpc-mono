// src/modules/affiliate/commission/application/find-commissions.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { CommissionStatus, ExchangeCurrencyCode } from 'src/generated/prisma';
import { AffiliateCommission } from '../domain';
import { AFFILIATE_COMMISSION_REPOSITORY } from '../ports/out/affiliate-commission.repository.token';
import type { AffiliateCommissionRepositoryPort } from '../ports/out/affiliate-commission.repository.port';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';

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

interface FindCommissionsResult {
  commissions: AffiliateCommission[];
  total: number;
}

@Injectable()
export class FindCommissionsService {
  private readonly logger = new Logger(FindCommissionsService.name);

  constructor(
    @Inject(AFFILIATE_COMMISSION_REPOSITORY)
    private readonly repository: AffiliateCommissionRepositoryPort,
  ) { }

  async execute({
    affiliateId,
    options,
    requestInfo,
  }: FindCommissionsParams): Promise<FindCommissionsResult> {
    try {
      const [commissions, total] = await Promise.all([
        this.repository.findByAffiliateId(affiliateId, options),
        this.repository.countByAffiliateId(affiliateId, {
          status: options?.status,
          currency: options?.currency,
          startDate: options?.startDate,
          endDate: options?.endDate,
        }),
      ]);

      return { commissions, total };
    } catch (error) {
      this.logger.error(
        `커미션 목록 조회 실패 - affiliateId: ${affiliateId}, options: ${JSON.stringify(options)}`,
        error,
      );
      throw error;
    }
  }
}
