// src/modules/affiliate/referral/application/find-referrals-by-affiliate-id.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Referral } from '../domain';
import { REFERRAL_REPOSITORY } from '../ports/out/referral.repository.token';
import type { ReferralRepositoryPort } from '../ports/out/referral.repository.port';

interface FindReferralsByAffiliateIdParams {
  affiliateId: string;
}

@Injectable()
export class FindReferralsByAffiliateIdService {
  constructor(
    @Inject(REFERRAL_REPOSITORY)
    private readonly repository: ReferralRepositoryPort,
  ) {}

  async execute({
    affiliateId,
  }: FindReferralsByAffiliateIdParams): Promise<Referral[]> {
    return await this.repository.findByAffiliateId(affiliateId);
  }
}
