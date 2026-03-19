import { PaginatedData } from 'src/common/http/types/pagination.types';

export interface CouponAllowlistRepositoryPort {
  findMany(params: {
    couponId: bigint;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<PaginatedData<{ userId: bigint; createdAt: Date }>>;

  addMany(couponId: bigint, userIds: bigint[]): Promise<void>;

  remove(couponId: bigint, userId: bigint): Promise<void>;

  clear(couponId: bigint): Promise<void>;
}

export const COUPON_ALLOWLIST_REPOSITORY_TOKEN = Symbol(
  'COUPON_ALLOWLIST_REPOSITORY_TOKEN',
);
