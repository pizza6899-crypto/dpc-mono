// src/modules/affiliate/commission/application/get-commission-rate.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { AffiliateTierLevel, Prisma } from '@repo/database';
import { AffiliateTier, CommissionPolicy } from '../domain';
import { AFFILIATE_TIER_REPOSITORY } from '../ports/out/affiliate-tier.repository.token';
import type { AffiliateTierRepositoryPort } from '../ports/out/affiliate-tier.repository.port';
import { IdUtil } from 'src/utils/id.util';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';

interface GetCommissionRateParams {
  affiliateId: bigint;
  requestInfo?: RequestClientInfo;
}

interface CommissionRateResult {
  tier: AffiliateTierLevel;
  baseRate: Prisma.Decimal;
  customRate: Prisma.Decimal | null;
  isCustomRate: boolean;
  effectiveRate: Prisma.Decimal; // 실제 적용되는 요율
}

@Injectable()
export class GetCommissionRateService {
  private readonly logger = new Logger(GetCommissionRateService.name);

  constructor(
    @Inject(AFFILIATE_TIER_REPOSITORY)
    private readonly repository: AffiliateTierRepositoryPort,
    private readonly policy: CommissionPolicy,
    private readonly dispatchLogService: DispatchLogService,
  ) {}

  async execute({
    affiliateId,
    requestInfo,
  }: GetCommissionRateParams): Promise<CommissionRateResult> {
    try {
      // 티어 조회 (없으면 기본 티어로 생성)
      let tier = await this.repository.findByAffiliateId(affiliateId);

      if (!tier) {
        // 기본 티어(BRONZE)로 생성
        const baseRate = this.policy.getBaseRateForTier(
          AffiliateTierLevel.BRONZE,
        );
        const newTier = AffiliateTier.create({
          uid: IdUtil.generateUid(),
          affiliateId,
          tier: AffiliateTierLevel.BRONZE,
          baseRate,
        });
        tier = await this.repository.upsert(newTier);
      }

      const result = {
        tier: tier.tier,
        baseRate: tier.baseRate,
        customRate: tier.customRate,
        isCustomRate: tier.isCustomRate,
        effectiveRate: tier.getEffectiveRate(),
      };

      // Audit Log 기록 (사용자가 커미션 요율 조회)
      if (requestInfo) {
        await this.dispatchLogService.dispatch(
          {
            type: LogType.ACTIVITY,
            data: {
              userId: affiliateId.toString(),
              category: 'AFFILIATE',
              action: 'COMMISSION_RATE_VIEW',
              metadata: {
                affiliateId: affiliateId.toString(),
                tier: tier.tier,
                baseRate: tier.baseRate.toString(),
                customRate: tier.customRate?.toString() || null,
                isCustomRate: tier.isCustomRate,
                effectiveRate: tier.getEffectiveRate().toString(),
              },
            },
          },
          requestInfo,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(
        `커미션 요율 조회 실패 - affiliateId: ${affiliateId}`,
        error,
      );
      throw error;
    }
  }
}
