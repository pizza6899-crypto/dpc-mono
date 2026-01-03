import { Inject, Injectable } from '@nestjs/common';
import { AffiliateTierLevel, Prisma } from '@repo/database';
import {
  AffiliateTier,
  CommissionPolicy,
} from '../domain';
import { AFFILIATE_TIER_REPOSITORY } from '../ports/out/affiliate-tier.repository.token';
import type { AffiliateTierRepositoryPort } from '../ports/out/affiliate-tier.repository.port';
import { IdUtil } from 'src/utils/id.util';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { Transactional } from '@nestjs-cls/transactional';

interface SetCustomRateParams {
  affiliateId: bigint;
  customRate: Prisma.Decimal;
  setBy: bigint; // 관리자 ID
  requestInfo?: RequestClientInfo;
}

@Injectable()
export class SetCustomRateService {
  constructor(
    @Inject(AFFILIATE_TIER_REPOSITORY)
    private readonly repository: AffiliateTierRepositoryPort,
    private readonly policy: CommissionPolicy,
  ) { }

  @Transactional()
  async execute({
    affiliateId,
    customRate,
    setBy,
  }: SetCustomRateParams): Promise<AffiliateTier> {
    // 요율 유효성 검증 (Policy에서 먼저 검증)
    // tier.setCustomRate() 내부에서도 검증하지만, Policy에서 먼저 검증하여
    // 명확한 에러 메시지를 제공
    this.policy.validateRate(customRate);

    // 티어 조회 (없으면 기본 티어로 생성)
    let tier = await this.repository.findByAffiliateId(affiliateId);

    if (!tier) {
      // 기본 티어(BRONZE)로 생성
      const baseRate = this.policy.getBaseRateForTier(
        AffiliateTierLevel.BRONZE,
      );
      tier = AffiliateTier.create({
        uid: IdUtil.generateUid(),
        affiliateId,
        tier: AffiliateTierLevel.BRONZE,
        baseRate,
      });
      tier = await this.repository.upsert(tier);
    }

    // 수동 요율 설정 (엔티티 상태 변경)
    tier.setCustomRate(customRate, setBy);

    // 엔티티를 변경한 후 Repository에 저장
    // repository.setCustomRate()는 직접 DB 업데이트하지만,
    // 엔티티를 변경한 후 upsert()를 사용하는 것이 더 일관성 있는 패턴
    return await this.repository.upsert(tier);
  }
}
