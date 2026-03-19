import { Inject, Injectable } from '@nestjs/common';
import { COUPON_REPOSITORY_TOKEN } from '../ports/coupon.repository.token';
import type { CouponRepositoryPort } from '../ports/coupon.repository.port';
import { Coupon } from '../domain/coupon.entity';
import { CouponNotFoundException } from '../domain/coupon.exception';

@Injectable()
export class GetCouponService {
  constructor(
    @Inject(COUPON_REPOSITORY_TOKEN)
    private readonly repository: CouponRepositoryPort,
  ) {}

  /**
   * ID로 쿠폰 정보 조회
   */
  async getById(id: bigint): Promise<Coupon> {
    const coupon = await this.repository.findById(id);
    if (!coupon) {
      throw new CouponNotFoundException();
    }
    return coupon;
  }

  /**
   * 코드로 쿠폰 정보 조회 (Validation 용도 등)
   */
  async getByCode(code: string): Promise<Coupon> {
    const coupon = await this.repository.findByCode(code);
    if (!coupon) {
      throw new CouponNotFoundException();
}
    return coupon;
  }
}
