import { Inject, Injectable } from '@nestjs/common';
import { AffiliateCode, AffiliateCodeNotFoundException } from '../domain';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';

interface FindDefaultCodeParams {
  userId: bigint;
}

@Injectable()
export class FindDefaultCodeService {
  constructor(
    @Inject(AFFILIATE_CODE_REPOSITORY)
    private readonly repository: AffiliateCodeRepositoryPort,
  ) { }

  async execute({
    userId,
  }: FindDefaultCodeParams): Promise<AffiliateCode> {
    const defaultCode = await this.repository.findDefaultByUserId(userId);

    if (!defaultCode) {
      throw new AffiliateCodeNotFoundException(`Default code for user ${userId}`);
    }

    return defaultCode;
  }
}
