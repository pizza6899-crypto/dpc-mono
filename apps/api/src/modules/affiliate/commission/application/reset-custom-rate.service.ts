import { Inject, Injectable } from '@nestjs/common';
import { AffiliateTier } from '../domain';
import { AFFILIATE_TIER_REPOSITORY } from '../ports/out/affiliate-tier.repository.token';
import type { AffiliateTierRepositoryPort } from '../ports/out/affiliate-tier.repository.port';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { Transactional } from '@nestjs-cls/transactional';

interface ResetCustomRateParams {
  affiliateId: bigint;
  resetBy: bigint; // 관리자 ID
  requestInfo?: RequestClientInfo;
}

@Injectable()
export class ResetCustomRateService {
  constructor(
    @Inject(AFFILIATE_TIER_REPOSITORY)
    private readonly repository: AffiliateTierRepositoryPort,
  ) { }

  @Transactional()
  async execute({
    affiliateId,
  }: ResetCustomRateParams): Promise<AffiliateTier> {
    // 티어 조회
    const tier = await this.repository.getByAffiliateId(affiliateId);

    // 수동 요율 해제 (엔티티 상태 변경)
    tier.resetCustomRate();

    // 엔티티를 변경한 후 Repository에 저장
    return await this.repository.upsert(tier);
  }
}
