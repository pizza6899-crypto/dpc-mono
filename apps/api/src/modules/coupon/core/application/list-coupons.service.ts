import { Inject, Injectable } from '@nestjs/common';
import { COUPON_REPOSITORY_TOKEN } from '../ports/coupon.repository.token';
import type { CouponRepositoryPort } from '../ports/coupon.repository.port';
import { Coupon } from '../domain/coupon.entity';
import { GetAdminCouponsRequestDto } from '../controllers/admin/dto/request/get-coupons.request.dto';
import { PaginatedData } from 'src/common/http/types/pagination.types';

@Injectable()
export class ListCouponsService {
  constructor(
    @Inject(COUPON_REPOSITORY_TOKEN)
    private readonly repository: CouponRepositoryPort,
  ) {}

  /**
   * 필터링 및 페이징된 쿠폰 목록 조회
   */
  async execute(
    query: GetAdminCouponsRequestDto,
  ): Promise<PaginatedData<Coupon>> {
    return await this.repository.findMany({
      id: query.id ? BigInt(query.id) : undefined,
      code: query.code,
      status: query.status,
      startsAfter: query.startsAfter,
      expiresBefore: query.expiresBefore,
      page: query.page!,
      limit: query.limit!,
      sortBy: query.sortBy!,
      sortOrder: query.sortOrder!,
    });
  }
}
