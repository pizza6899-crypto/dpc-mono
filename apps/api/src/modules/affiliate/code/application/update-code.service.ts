// src/modules/affiliate/code/application/update-code.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { AffiliateCode, AffiliateCodeNotFoundException } from '../domain';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';

interface UpdateCodeParams {
  id: string;
  userId: bigint;
  campaignName?: string;
}

@Injectable()
export class UpdateCodeService {
  constructor(
    @Inject(AFFILIATE_CODE_REPOSITORY)
    private readonly repository: AffiliateCodeRepositoryPort,
  ) { }

  async execute({
    id,
    userId,
    campaignName,
  }: UpdateCodeParams): Promise<AffiliateCode> {
    const code = await this.repository.findById(id, userId);

    if (!code) {
      throw new AffiliateCodeNotFoundException(id);
    }

    // 도메인 엔티티 업데이트
    code.updateCampaignName(campaignName);

    // 저장
    return await this.repository.update(code);
  }
}
