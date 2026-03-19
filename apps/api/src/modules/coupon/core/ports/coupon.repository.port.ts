import { PaginatedData } from 'src/common/http/types/pagination.types';
import { Coupon } from '../domain/coupon.entity';
import { CouponStatus } from '@prisma/client';

export interface CouponRepositoryPort {
  /**
   * ID로 쿠폰 조회 (Rewards 포함)
   */
  findById(id: bigint): Promise<Coupon | null>;

  /**
   * 쿠폰 코드로 쿠폰 조회 (Rewards 포함)
   */
  findByCode(code: string): Promise<Coupon | null>;

  /**
   * 쿠폰 저장 (생성 또는 수정)
   */
  save(coupon: Coupon): Promise<void>;

  /**
   * 특정 유저가 쿠폰 허용 리스트에 포함되어 있는지 확인
   */
  isUserInAllowlist(couponId: bigint, userId: bigint): Promise<boolean>;

  /**
   * 필터링 및 페이징을 지원하는 쿠폰 목록 조회
   */
  findMany(params: {
    id?: bigint;
    code?: string;
    status?: CouponStatus;
    startsAfter?: Date;
    expiresBefore?: Date;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<PaginatedData<Coupon>>;

  /**
   * 전체 쿠폰 목록 조회 (단위 테스트 또는 내부 로직용)
   */
  findAll(): Promise<Coupon[]>;
}
