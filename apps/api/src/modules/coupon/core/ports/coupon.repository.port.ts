import { Coupon } from '../domain/coupon.entity';

export interface CouponRepositoryPort {
  findById(id: bigint): Promise<Coupon | null>;
  findByCode(code: string): Promise<Coupon | null>;
  save(coupon: Coupon): Promise<void>;
  delete(id: bigint): Promise<void>;
}
