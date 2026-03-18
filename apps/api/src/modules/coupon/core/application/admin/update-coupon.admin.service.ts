import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { COUPON_REPOSITORY_TOKEN } from '../../ports/coupon.repository.token';
import type { CouponRepositoryPort } from '../../ports/coupon.repository.port';
import { Coupon } from '../../domain/coupon.entity';
import { UpdateCouponAdminRequestDto } from '../../controllers/admin/dto/request/update-coupon.admin.request.dto';

@Injectable()
export class UpdateCouponAdminService {
  constructor(
    @Inject(COUPON_REPOSITORY_TOKEN)
    private readonly couponRepository: CouponRepositoryPort,
  ) { }

  async execute(id: bigint, dto: UpdateCouponAdminRequestDto, adminId: bigint): Promise<Coupon> {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    coupon.update({
      metadata: dto.metadata,
      maxUsage: dto.maxUsage,
      maxUsagePerUser: dto.maxUsagePerUser,
      startsAt: dto.startsAt,
      expiresAt: dto.expiresAt,
    });

    // In a more complex scenario, I'd probably add updatedBy to the entity.update(...)
    // However, Coupon.update doesn't currently take updatedBy as param. 
    // I can modify the entity if needed or just use this._updatedBy if accessible.
    // For now, I'll stick to the existing entity structure.
    (coupon as any)._updatedBy = adminId;

    await this.couponRepository.save(coupon);

    return coupon;
  }
}
