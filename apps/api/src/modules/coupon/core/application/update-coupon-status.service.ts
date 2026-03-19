import { Transactional } from '@nestjs-cls/transactional';
import { Inject, Injectable } from '@nestjs/common';
import { CouponStatus } from '@prisma/client';
import { COUPON_REPOSITORY_TOKEN } from '../ports/coupon.repository.token';
import type { CouponRepositoryPort } from '../ports/coupon.repository.port';
import { Coupon } from '../domain/coupon.entity';
import { CouponNotFoundException } from '../domain/coupon.exception';

@Injectable()
export class UpdateCouponStatusService {
  constructor(
    @Inject(COUPON_REPOSITORY_TOKEN)
    private readonly repository: CouponRepositoryPort,
  ) {}

  @Transactional()
  async execute(id: bigint, status: CouponStatus, adminId: bigint): Promise<Coupon> {
    const coupon = await this.repository.findById(id);
    if (!coupon) {
      throw new CouponNotFoundException();
    }

    coupon.updateStatus(status, adminId);

    await this.repository.save(coupon);

    return coupon;
  }
}
