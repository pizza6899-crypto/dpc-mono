import { Injectable, Inject } from '@nestjs/common';
import { COUPON_REPOSITORY_TOKEN } from '../../ports/coupon.repository.token';
import type { CouponRepositoryPort } from '../../ports/coupon.repository.port';
import { Coupon } from '../../domain/coupon.entity';
import { CouponReward } from '../../domain/coupon-reward.entity';
import { CreateCouponAdminRequestDto } from '../../controllers/admin/dto/request/create-coupon.admin.request.dto';
import { Prisma } from '@prisma/client';
import { CouponAlreadyExistsException } from '../../domain/coupon.exception';

@Injectable()
export class CreateCouponAdminService {
  constructor(
    @Inject(COUPON_REPOSITORY_TOKEN)
    private readonly couponRepository: CouponRepositoryPort,
  ) { }

  async execute(dto: CreateCouponAdminRequestDto, adminId: bigint): Promise<Coupon> {
    // 1. Check if code already exists
    const existing = await this.couponRepository.findByCode(dto.code);
    if (existing) {
      throw new CouponAlreadyExistsException(dto.code);
    }

    // 2. Create coupon aggregate root
    const coupon = Coupon.create({
      code: dto.code,
      metadata: dto.metadata,
      isAllowlistOnly: dto.isAllowlistOnly,
      maxUsage: dto.maxUsage,
      maxUsagePerUser: dto.maxUsagePerUser,
      startsAt: dto.startsAt ?? null,
      expiresAt: dto.expiresAt ?? null,
      createdBy: adminId,
    });

    // 3. Create rewards and attach to the aggregate
    const rewards = dto.rewards.map(r =>
      CouponReward.create({
        couponId: coupon.id,
        rewardType: r.rewardType,
        currency: r.currency,
        amount: r.amount,
        wageringMultiplier: r.wageringMultiplier,
        maxCashConversion: r.maxCashConversion,
      })
    );

    // [Aggregate Pattern] Injecting rewards into the coupon instance
    // Note: In Coupon entity, _rewards is private but we have a way to populate it (e.g. fromPersistence or a dedicated domain method)
    // Here we use the fact that we're within the same module, but for strictness, 
    // we should ideally update the domain to support adding rewards.
    // However, Coupon.fromPersistence is often used or a method like addReward.

    // For now, I'll use a clean recreation via fromPersistence style if needed, 
    // or just assume we're adding it.
    (coupon as any)._rewards = rewards;

    // 4. Save aggregate
    await this.couponRepository.save(coupon);

    return coupon;
  }
}
