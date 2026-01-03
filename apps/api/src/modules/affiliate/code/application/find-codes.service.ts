// src/modules/affiliate/code/application/find-codes.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { AffiliateCode } from '../domain';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';

interface FindCodesParams {
  userId: bigint;
}

@Injectable()
export class FindCodesService {
  constructor(
    @Inject(AFFILIATE_CODE_REPOSITORY)
    private readonly repository: AffiliateCodeRepositoryPort,
  ) { }

  async execute({ userId }: FindCodesParams): Promise<{
    codes: AffiliateCode[];
    total: number;
    limit: number;
  }> {
    const codes = await this.repository.findByUserId(userId);
    const total = await this.repository.countByUserId(userId);

    return {
      codes,
      total,
      limit: 20, // MAX_CODES_PER_USER
    };
  }
}
