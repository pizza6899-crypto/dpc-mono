import { Injectable, Inject } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { RewardSourceType, WageringTargetType } from '@prisma/client';
import { COUPON_REPOSITORY_TOKEN } from '../../core/ports/coupon.repository.token';
import { COUPON_ALLOWLIST_REPOSITORY_TOKEN } from '../../core/ports/coupon-allowlist.repository.port';
import type { CouponRepositoryPort } from '../../core/ports/coupon.repository.port';
import type { CouponAllowlistRepositoryPort } from '../../core/ports/coupon-allowlist.repository.port';
import { USER_COUPON_REPOSITORY_TOKEN, type UserCouponRepositoryPort } from '../ports/user-coupon.repository.port';
import { GrantRewardService } from 'src/modules/reward/core/application/grant-reward.service';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import { CouponNotFoundException } from '../../core/domain/coupon.exception';
import { Coupon } from '../../core/domain/coupon.entity';

@Injectable()
export class ApplyCouponService {
  constructor(
    @Inject(COUPON_REPOSITORY_TOKEN)
    private readonly couponRepository: CouponRepositoryPort,
    @Inject(COUPON_ALLOWLIST_REPOSITORY_TOKEN)
    private readonly allowlistRepository: CouponAllowlistRepositoryPort,
    @Inject(USER_COUPON_REPOSITORY_TOKEN)
    private readonly userCouponRepository: UserCouponRepositoryPort,
    private readonly grantRewardService: GrantRewardService,
    private readonly snowflakeService: SnowflakeService,
  ) {}

  @Transactional()
  async execute(userId: bigint, code: string): Promise<Coupon> {
    const now = new Date();

    // 1. 쿠폰 조회 (Lock을 걸어 동시성 문제 예약 - 필요시 repository 수준에서 처리)
    const coupon = await this.couponRepository.findByCode(code);
    if (!coupon) {
      throw new CouponNotFoundException();
    }

    // 2. 유저별 사용 횟수 및 허용 리스트 확인을 위한 데이터 조회
    const [userUsageCount, isUserInAllowlist] = await Promise.all([
      this.userCouponRepository.countUserCouponUsage(userId, coupon.id),
      this.couponRepository.isUserInAllowlist(coupon.id, userId),
    ]);

    // 3. 도메인 엔진을 통한 자격 검증
    coupon.validateEligibility({
      userId,
      userUsageCount,
      isUserInAllowlist,
      now,
    });

    // 4. 쿠폰 상태 변경 및 사용 이력 기록
    coupon.incrementUsage();
    await this.couponRepository.save(coupon);

    const { id: usageRecordId } = this.snowflakeService.generate();
    await this.userCouponRepository.recordUsage({
      id: usageRecordId,
      userId,
      couponId: coupon.id,
      usedAt: now,
    });

    // 5. 보상 지급 (Reward Module 연동)
    for (const reward of coupon.rewards) {
      await this.grantRewardService.execute({
        userId,
        sourceType: RewardSourceType.COUPON,
        sourceId: coupon.id,
        rewardType: reward.rewardType,
        currency: reward.currency,
        amount: reward.amount,
        wageringTargetType: WageringTargetType.AMOUNT, // 기본적으로 베팅 금액 누적 기준으로 가정
        wageringMultiplier: reward.wageringMultiplier ?? undefined,
        maxCashConversion: reward.maxCashConversion ?? undefined,
        reason: `Coupon applied: ${coupon.code}`,
      });
    }

    return coupon;
  }
}
