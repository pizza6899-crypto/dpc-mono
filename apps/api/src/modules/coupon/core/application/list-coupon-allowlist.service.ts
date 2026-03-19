import { Inject, Injectable } from '@nestjs/common';
import { COUPON_ALLOWLIST_REPOSITORY_TOKEN, type CouponAllowlistRepositoryPort } from '../ports/coupon-allowlist.repository.port';
import { PaginatedData } from 'src/common/http/types/pagination.types';

@Injectable()
export class ListCouponAllowlistService {
  constructor(
    @Inject(COUPON_ALLOWLIST_REPOSITORY_TOKEN)
    private readonly repository: CouponAllowlistRepositoryPort,
  ) { }

  async execute(params: {
    couponId: bigint;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<PaginatedData<{ userId: bigint; createdAt: Date }>> {
    return this.repository.findMany(params);
  }
}
