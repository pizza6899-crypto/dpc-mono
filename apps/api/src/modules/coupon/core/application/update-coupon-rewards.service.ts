import { Transactional } from '@nestjs-cls/transactional';
import { Inject, Injectable } from '@nestjs/common';
import { COUPON_REPOSITORY_TOKEN } from '../ports/coupon.repository.token';
import type { CouponRepositoryPort } from '../ports/coupon.repository.port';
import { Coupon, CouponRewardProps } from '../domain/coupon.entity';
import { CouponNotFoundException } from '../domain/coupon.exception';

@Injectable()
export class UpdateCouponRewardsService {
  constructor(
    @Inject(COUPON_REPOSITORY_TOKEN)
    private readonly repository: CouponRepositoryPort,
  ) {}

  @Transactional()
  async execute(
    id: bigint,
    rewards: CouponRewardProps[],
    adminId: bigint,
  ): Promise<Coupon> {
    const coupon = await this.repository.findById(id);
    if (!coupon) {
      throw new CouponNotFoundException();
    }

    coupon.updateRewards(rewards, adminId);

    const savedCoupon = await this.repository.save(coupon);

    return savedCoupon;
  }
}
