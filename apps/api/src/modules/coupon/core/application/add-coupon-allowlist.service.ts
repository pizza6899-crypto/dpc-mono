import { Transactional } from '@nestjs-cls/transactional';
import { Inject, Injectable } from '@nestjs/common';
import {
  COUPON_ALLOWLIST_REPOSITORY_TOKEN,
  type CouponAllowlistRepositoryPort,
} from '../ports/coupon-allowlist.repository.port';

@Injectable()
export class AddCouponAllowlistService {
  constructor(
    @Inject(COUPON_ALLOWLIST_REPOSITORY_TOKEN)
    private readonly repository: CouponAllowlistRepositoryPort,
  ) {}

  @Transactional()
  async execute(couponId: bigint, userIds: bigint[]): Promise<void> {
    await this.repository.addMany(couponId, userIds);
  }
}
