import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { COUPON_REPOSITORY_TOKEN } from '../../ports/coupon.repository.token';
import type { CouponRepositoryPort } from '../../ports/coupon.repository.port';
import { Coupon } from '../../domain/coupon.entity';
import { UpdateCouponStatusAdminRequestDto } from '../../controllers/admin/dto/request/update-coupon-status.admin.request.dto';

@Injectable()
export class UpdateCouponStatusAdminService {
  constructor(
    @Inject(COUPON_REPOSITORY_TOKEN)
    private readonly couponRepository: CouponRepositoryPort,
  ) { }

  async execute(id: bigint, dto: UpdateCouponStatusAdminRequestDto, adminId: bigint): Promise<Coupon> {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    coupon.update({
      status: dto.status,
    });

    (coupon as any)._updatedBy = adminId;

    await this.couponRepository.save(coupon);

    return coupon;
  }
}
