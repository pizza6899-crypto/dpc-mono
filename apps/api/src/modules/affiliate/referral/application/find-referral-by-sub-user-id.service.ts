// src/modules/affiliate/referral/application/find-referral-by-sub-user-id.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Referral } from '../domain';
import { REFERRAL_REPOSITORY } from '../ports/out/referral.repository.token';
import type { ReferralRepositoryPort } from '../ports/out/referral.repository.port';

interface FindReferralBySubUserIdParams {
  subUserId: string;
}

@Injectable()
export class FindReferralBySubUserIdService {
  constructor(
    @Inject(REFERRAL_REPOSITORY)
    private readonly repository: ReferralRepositoryPort,
  ) {}

  async execute({
    subUserId,
  }: FindReferralBySubUserIdParams): Promise<Referral | null> {
    return await this.repository.findBySubUserId(subUserId);
  }
}
