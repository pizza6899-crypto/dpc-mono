import { Transactional } from '@nestjs-cls/transactional';
import { Inject, Injectable } from '@nestjs/common';
import { COUPON_REPOSITORY_TOKEN } from '../ports/coupon.repository.token';
import type { CouponRepositoryPort } from '../ports/coupon.repository.port';
import { Coupon } from '../domain/coupon.entity';
import { CouponMetadata } from '../domain/coupon.types';
import { CouponNotFoundException } from '../domain/coupon.exception';

export interface UpdateCouponCommand {
  adminId: bigint;
  metadata?: CouponMetadata;
  isAllowlistOnly?: boolean;
  maxUsage?: number;
  maxUsagePerUser?: number;
  startsAt?: Date | null;
  expiresAt?: Date | null;
}

@Injectable()
export class UpdateCouponService {
  constructor(
    @Inject(COUPON_REPOSITORY_TOKEN)
    private readonly repository: CouponRepositoryPort,
  ) {}

  @Transactional()
  async execute(id: bigint, command: UpdateCouponCommand): Promise<Coupon> {
    const coupon = await this.repository.findById(id);
    if (!coupon) {
      throw new CouponNotFoundException();
    }

    coupon.update(
      {
        metadata: command.metadata,
        isAllowlistOnly: command.isAllowlistOnly,
        maxUsage: command.maxUsage,
        maxUsagePerUser: command.maxUsagePerUser,
        startsAt: command.startsAt,
        expiresAt: command.expiresAt,
      },
      command.adminId,
    );

    await this.repository.save(coupon);

    return coupon;
  }
}
