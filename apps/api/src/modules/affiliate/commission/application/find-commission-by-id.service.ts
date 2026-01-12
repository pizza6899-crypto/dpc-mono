import { Inject, Injectable } from '@nestjs/common';
import { AffiliateCommission, InvalidParameterException } from '../domain';
import { AFFILIATE_COMMISSION_REPOSITORY } from '../ports/out/affiliate-commission.repository.token';
import type { AffiliateCommissionRepositoryPort } from '../ports/out/affiliate-commission.repository.port';

interface FindCommissionByIdParams {
  id: bigint; // 커미션 ID (BigInt)
  affiliateId?: bigint; // 사용자 액션인 경우 본인 확인용
}

@Injectable()
export class FindCommissionByIdService {

  constructor(
    @Inject(AFFILIATE_COMMISSION_REPOSITORY)
    private readonly repository: AffiliateCommissionRepositoryPort,
  ) { }

  async execute({
    id,
    affiliateId,
  }: FindCommissionByIdParams): Promise<AffiliateCommission | null> {
    if (!id) {
      throw new InvalidParameterException('id must be provided');
    }

    const commission = await this.repository.findById(id);

    return commission;
  }
}
