import { Inject, Injectable } from '@nestjs/common';
import { AffiliateCommission, InvalidParameterException } from '../domain';
import { AFFILIATE_COMMISSION_REPOSITORY } from '../ports/out/affiliate-commission.repository.token';
import type { AffiliateCommissionRepositoryPort } from '../ports/out/affiliate-commission.repository.port';

interface FindCommissionByIdParams {
  uid?: string; // 비즈니스용 (CUID)
  id?: bigint; // 어드민용 (BigInt)
  affiliateId?: bigint; // 사용자 액션인 경우 본인 확인용
}

@Injectable()
export class FindCommissionByIdService {

  constructor(
    @Inject(AFFILIATE_COMMISSION_REPOSITORY)
    private readonly repository: AffiliateCommissionRepositoryPort,
  ) { }

  async execute({
    uid,
    id,
    affiliateId,
  }: FindCommissionByIdParams): Promise<AffiliateCommission | null> {
    let commission: AffiliateCommission | null = null;

    // uid가 제공되면 우선 사용 (비즈니스용)
    if (uid) {
      commission = await this.repository.findByUid(uid);
    } else if (id) {
      // id가 제공되면 사용 (어드민용)
      commission = await this.repository.findById(id);
    } else {
      // 둘 다 없으면 에러
      throw new InvalidParameterException('Either uid or id must be provided');
    }

    return commission;
  }
}
