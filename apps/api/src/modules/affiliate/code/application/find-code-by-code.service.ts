// src/modules/affiliate/code/application/find-code-by-code.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { AffiliateCode } from '../domain';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';

interface FindCodeByCodeParams {
  code: string;
}

@Injectable()
export class FindCodeByCodeService {
  constructor(
    @Inject(AFFILIATE_CODE_REPOSITORY)
    private readonly repository: AffiliateCodeRepositoryPort,
  ) {}

  async execute({ code }: FindCodeByCodeParams): Promise<AffiliateCode | null> {
    return await this.repository.findByCode(code);
  }
}
