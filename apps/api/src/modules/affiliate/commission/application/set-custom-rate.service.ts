// src/modules/affiliate/commission/application/set-custom-rate.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CommissionPolicy } from '../domain';
import { USER_TIER_REPOSITORY } from '../../../tier/ports/repository.token';
import type { UserTierRepositoryPort } from '../../../tier/ports/user-tier.repository.port';
import { UserTierNotFoundException } from '../../../tier/domain';
import { Transactional } from '@nestjs-cls/transactional';
import { UserTier } from '../../../tier/domain';

interface SetCustomRateParams {
  affiliateId: bigint;
  customRate: Prisma.Decimal;
}

interface SetCustomRateResult {
  tierCode: string;
  baseRate: Prisma.Decimal;
  customRate: Prisma.Decimal;
  isCustomRate: boolean;
  effectiveRate: Prisma.Decimal;
}

@Injectable()
export class SetCustomRateService {
  constructor(
    @Inject(USER_TIER_REPOSITORY)
    private readonly userTierRepository: UserTierRepositoryPort,
    private readonly policy: CommissionPolicy,
  ) { }

  @Transactional()
  async execute({
    affiliateId,
    customRate,
  }: SetCustomRateParams): Promise<SetCustomRateResult> {
    // 요율 유효성 검증
    this.policy.validateRate(customRate);

    // UserTier 조회
    const userTier = await this.userTierRepository.findByUserId(affiliateId);

    if (!userTier || !userTier.tier) {
      throw new UserTierNotFoundException(affiliateId);
    }

    // 수동 요율 설정
    userTier.setAffiliateCustomRate(customRate);

    // 저장
    await this.userTierRepository.update(userTier);

    return {
      tierCode: userTier.tier.code,
      baseRate: userTier.tier.affiliateCommissionRate,
      customRate: customRate,
      isCustomRate: true,
      effectiveRate: customRate,
    };
  }
}
