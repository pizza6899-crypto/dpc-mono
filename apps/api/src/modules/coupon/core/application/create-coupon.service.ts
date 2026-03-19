import { Transactional } from '@nestjs-cls/transactional';
import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { COUPON_REPOSITORY_TOKEN } from '../ports/coupon.repository.token';
import type { CouponRepositoryPort } from '../ports/coupon.repository.port';
import { Coupon, CouponRewardProps } from '../domain/coupon.entity';
import { CouponMetadata } from '../domain/coupon.types';

export interface CreateCouponCommand {
  code: string;
  metadata?: CouponMetadata;
  isAllowlistOnly?: boolean;
  maxUsage?: number;
  maxUsagePerUser?: number;
  startsAt?: Date;
  expiresAt?: Date;
  rewards: CouponRewardProps[];
  adminId: bigint;
}

@Injectable()
export class CreateCouponService {
  constructor(
    @Inject(COUPON_REPOSITORY_TOKEN)
    private readonly repository: CouponRepositoryPort,
  ) {}

  @Transactional()
  async execute(command: CreateCouponCommand): Promise<Coupon> {
    // 1. 중복 코드 확인
    const existing = await this.repository.findByCode(command.code);
    if (existing) {
      throw new ConflictException(
        `Coupon code already exists: ${command.code}`,
      );
    }

    // 2. 엔티티 생성
    const coupon = Coupon.create({
      code: command.code,
      metadata: command.metadata,
      isAllowlistOnly: command.isAllowlistOnly,
      maxUsage: command.maxUsage,
      maxUsagePerUser: command.maxUsagePerUser,
      startsAt: command.startsAt,
      expiresAt: command.expiresAt,
      rewards: command.rewards,
      createdBy: command.adminId,
    });

    // 3. 영속화
    await this.repository.save(coupon);

    return coupon;
  }
}
