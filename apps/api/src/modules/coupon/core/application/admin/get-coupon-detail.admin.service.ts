import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { COUPON_REPOSITORY_TOKEN } from '../../ports/coupon.repository.token';
import type { CouponRepositoryPort } from '../../ports/coupon.repository.port';
import { Coupon } from '../../domain/coupon.entity';

@Injectable()
export class GetCouponDetailAdminService {
  constructor(
    @Inject(COUPON_REPOSITORY_TOKEN)
    private readonly couponRepository: CouponRepositoryPort,
  ) { }

  async execute(id: bigint): Promise<Coupon> {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }
    return coupon;
  }
}
