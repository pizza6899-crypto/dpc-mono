import { CouponConfig } from '../domain/coupon-config.entity';

export interface CouponConfigRepositoryPort {
  find(): Promise<CouponConfig>;
  update(config: CouponConfig): Promise<void>;
}
