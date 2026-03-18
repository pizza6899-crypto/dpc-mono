import { Coupon } from '../domain/coupon.entity';

export interface CouponRepositoryPort {
  findById(id: bigint): Promise<Coupon | null>;
  findByCode(code: string): Promise<Coupon | null>;
  findAll(params: {
    code?: string;
    status?: string[];
    startsAt?: Date;
    expiresAt?: Date;
    skip?: number;
    take?: number;
  }): Promise<{ items: Coupon[]; total: number }>;
  save(coupon: Coupon): Promise<void>;
  delete(id: bigint): Promise<void>;
}
