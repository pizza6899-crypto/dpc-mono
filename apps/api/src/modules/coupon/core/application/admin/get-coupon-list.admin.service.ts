import { Injectable, Inject } from '@nestjs/common';
import { COUPON_REPOSITORY_TOKEN } from '../../ports/coupon.repository.token';
import type { CouponRepositoryPort } from '../../ports/coupon.repository.port';
import { GetCouponListAdminQueryDto } from '../../controllers/admin/dto/request/get-coupon-list.admin.query.dto';
import { Coupon } from '../../domain/coupon.entity';
import { PaginatedData } from 'src/common/http/types/pagination.types';

@Injectable()
export class GetCouponListAdminService {
  constructor(
    @Inject(COUPON_REPOSITORY_TOKEN)
    private readonly couponRepository: CouponRepositoryPort,
  ) { }

  async execute(query: GetCouponListAdminQueryDto): Promise<PaginatedData<Coupon>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const take = limit;

    const { items, total } = await this.couponRepository.findAll({
      code: query.code,
      status: query.status,
      startsAt: query.startsAt, // Already Date | undefined from DTO
      expiresAt: query.expiresAt, // Already Date | undefined from DTO
      skip,
      take,
    });

    return {
      data: items,
      total,
      page,
      limit,
    };
  }
}
