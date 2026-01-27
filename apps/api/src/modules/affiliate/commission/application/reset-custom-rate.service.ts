// src/modules/affiliate/commission/application/reset-custom-rate.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { USER_TIER_REPOSITORY } from '../../../tier/ports/repository.token';
import type { UserTierRepositoryPort } from '../../../tier/ports/user-tier.repository.port';
import { UserTierNotFoundException } from '../../../tier/domain';
import { Transactional } from '@nestjs-cls/transactional';

interface ResetCustomRateParams {
  affiliateId: bigint;
}

interface ResetCustomRateResult {
  tierCode: string;
  baseRate: Prisma.Decimal;
  customRate: null;
  isCustomRate: false;
  effectiveRate: Prisma.Decimal;
}

@Injectable()
export class ResetCustomRateService {
  constructor(
    @Inject(USER_TIER_REPOSITORY)
    private readonly userTierRepository: UserTierRepositoryPort,
  ) { }

  @Transactional()
  async execute({
    affiliateId,
  }: ResetCustomRateParams): Promise<ResetCustomRateResult> {
    // UserTier 조회
    const userTier = await this.userTierRepository.findByUserId(affiliateId);

    if (!userTier || !userTier.tier) {
      throw new UserTierNotFoundException(affiliateId);
    }

    // 수동 요율 해제 (기능 임시 중단)
    // userTier.resetAffiliateCustomRate();

    // 저장
    // await this.userTierRepository.update(userTier);

    return {
      tierCode: userTier.tier.code,
      baseRate: new Prisma.Decimal(0), // 임시
      customRate: null,
      isCustomRate: false,
      effectiveRate: new Prisma.Decimal(0), // 임시
    };
  }
}
