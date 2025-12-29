// src/modules/affiliate/commission/application/find-commissions.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { CommissionStatus, ExchangeCurrencyCode } from '@repo/database';
import { AffiliateCommission } from '../domain';
import { AFFILIATE_COMMISSION_REPOSITORY } from '../ports/out/affiliate-commission.repository.token';
import type { AffiliateCommissionRepositoryPort } from '../ports/out/affiliate-commission.repository.port';

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
}

@Injectable()
export class FindCommissionsService {
  private readonly logger = new Logger(FindCommissionsService.name);

  constructor(
    @Inject(AFFILIATE_COMMISSION_REPOSITORY)
    private readonly repository: AffiliateCommissionRepositoryPort,
  ) {}

  async execute({
    affiliateId,
    options,
  }: FindCommissionsParams): Promise<AffiliateCommission[]> {
    try {
      return await this.repository.findByAffiliateId(affiliateId, options);
    } catch (error) {
      this.logger.error(
        `커미션 목록 조회 실패 - affiliateId: ${affiliateId}, options: ${JSON.stringify(options)}`,
        error,
      );
      throw error;
    }
  }
}
