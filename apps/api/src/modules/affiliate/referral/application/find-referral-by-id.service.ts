// src/modules/affiliate/referral/application/find-referral-by-id.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Referral } from '../domain';
import { REFERRAL_REPOSITORY } from '../ports/out/referral.repository.token';
import type { ReferralRepositoryPort } from '../ports/out/referral.repository.port';
import { ReferralNotFoundException } from '../domain/referral.exception';

interface FindReferralByIdParams {
  id: string;
}

@Injectable()
export class FindReferralByIdService {
  constructor(
    @Inject(REFERRAL_REPOSITORY)
    private readonly repository: ReferralRepositoryPort,
  ) {}

  async execute({ id }: FindReferralByIdParams): Promise<Referral> {
    const referral = await this.repository.findById(id);
    if (!referral) {
      throw new ReferralNotFoundException(id);
    }
    return referral;
  }
}
