import { Inject, Injectable } from '@nestjs/common';
import { COUPON_CONFIG_REPOSITORY_TOKEN } from '../ports/coupon-config.repository.token';
import type { CouponConfigRepositoryPort } from '../ports/coupon-config.repository.port';
import { CouponConfig } from '../domain/coupon-config.entity';

@Injectable()
export class GetCouponConfigService {
  constructor(
    @Inject(COUPON_CONFIG_REPOSITORY_TOKEN)
    private readonly repository: CouponConfigRepositoryPort,
  ) { }

  async execute(): Promise<CouponConfig> {
    return this.repository.find();
  }
}
