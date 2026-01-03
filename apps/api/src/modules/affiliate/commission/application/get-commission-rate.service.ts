import { Inject, Injectable } from '@nestjs/common';
import { AffiliateTierLevel, Prisma } from '@repo/database';
import { AffiliateTier, CommissionPolicy } from '../domain';
import { AFFILIATE_TIER_REPOSITORY } from '../ports/out/affiliate-tier.repository.token';
import type { AffiliateTierRepositoryPort } from '../ports/out/affiliate-tier.repository.port';
import { IdUtil } from 'src/utils/id.util';

interface GetCommissionRateParams {
  affiliateId: bigint;
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

  constructor(
    @Inject(AFFILIATE_TIER_REPOSITORY)
    private readonly repository: AffiliateTierRepositoryPort,
    private readonly policy: CommissionPolicy,
  ) { }

  async execute({
    affiliateId,
  }: GetCommissionRateParams): Promise<CommissionRateResult> {
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

    return result;
  }
}
