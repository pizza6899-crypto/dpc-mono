// src/modules/affiliate/commission/application/get-commission-rate.service.ts
import { Injectable } from '@nestjs/common';
import { Prisma } from '@repo/database';
import { GetAffiliateRateService } from '../../../tier/application/get-affiliate-rate.service';
import { GetUserTierService } from '../../../tier/application/get-user-tier.service';

interface GetCommissionRateParams {
  affiliateId: bigint;
}

interface CommissionRateResult {
  tierCode: string; // Tier.code (e.g., "BRONZE", "SILVER")
  baseRate: Prisma.Decimal;
  customRate: Prisma.Decimal | null;
  isCustomRate: boolean;
  effectiveRate: Prisma.Decimal; // 실제 적용되는 요율
}

@Injectable()
export class GetCommissionRateService {
  constructor(
    private readonly getAffiliateRateService: GetAffiliateRateService,
    private readonly getUserTierService: GetUserTierService,
  ) { }

  async execute({
    affiliateId,
  }: GetCommissionRateParams): Promise<CommissionRateResult> {
    // UserTier 조회 (tier 정보 포함)
    const userTier = await this.getUserTierService.execute(affiliateId);

    if (!userTier || !userTier.tier) {
      throw new Error('User tier not found');
    }

    // 어필리에이트 요율 조회
    const { rate: effectiveRate, isCustom } =
      await this.getAffiliateRateService.execute(affiliateId);

    return {
      tierCode: userTier.tier.code,
      baseRate: userTier.tier.affiliateCommissionRate,
      customRate: userTier.affiliateCustomRate,
      isCustomRate: isCustom,
      effectiveRate,
    };
  }
}
