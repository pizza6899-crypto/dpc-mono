import { Injectable, Inject } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { RewardSourceType, WageringTargetType } from '@prisma/client';
import { COUPON_REPOSITORY_TOKEN } from '../../core/ports/coupon.repository.token';
import { COUPON_ALLOWLIST_REPOSITORY_TOKEN } from '../../core/ports/coupon-allowlist.repository.port';
import type { CouponRepositoryPort } from '../../core/ports/coupon.repository.port';
import type { CouponAllowlistRepositoryPort } from '../../core/ports/coupon-allowlist.repository.port';
import {
  USER_COUPON_REPOSITORY_TOKEN,
  type UserCouponRepositoryPort,
} from '../ports/user-coupon.repository.port';
import { GrantRewardService } from 'src/modules/reward/core/application/grant-reward.service';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import { RedisService } from 'src/infrastructure/redis/redis.service';
import { GetCouponConfigService } from '../../config/application/get-coupon-config.service';
import { CouponNotFoundException } from '../../core/domain/coupon.exception';
import { Coupon } from '../../core/domain/coupon.entity';
import {
  CouponDailyAttemptsExceededException,
  CouponSystemDisabledException,
} from '../../config/domain/coupon-config.exception';
import { Logger } from '@nestjs/common';

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
    private readonly redisService: RedisService,
    private readonly getCouponConfigService: GetCouponConfigService,
  ) {}

  private readonly logger = new Logger(ApplyCouponService.name);

  @Transactional()
  async execute(userId: bigint, code: string): Promise<Coupon> {
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
    const attemptKey = `coupon:attempts:user:${userId}:${dateKey}`;

    // 1. 글로벌 설정 확인 및 시도 횟수 제한 체크
    const config = await this.getCouponConfigService.execute();
    if (!config.isCouponEnabled) {
      throw new CouponSystemDisabledException();
    }

    // 시도 횟수 증가 및 체크 (실패하더라도 시도 횟수는 카운트)
    const currentAttempts = await this.redisService.incr(attemptKey);
    if (currentAttempts === 1) {
      await this.redisService.getClient().expire(attemptKey, 86400); // 24시간 TTL
    }

    if (currentAttempts > config.maxDailyAttemptsPerUser) {
      throw new CouponDailyAttemptsExceededException();
    }

    // 2. 쿠폰 조회
    let coupon = await this.couponRepository.findByCode(code);
    if (!coupon) {
      throw new CouponNotFoundException();
    }

    // 3. 동시성 제어를 위한 Redis 분산 락 (쿠폰 ID 기준)
    const lockKey = `lock:coupon:apply:${coupon.id}`;
    const lockValue = this.snowflakeService.generate().id.toString();
    const acquired = await this.redisService.setLock(lockKey, lockValue, 10); // 10초 락

    if (!acquired) {
      // 락 획득 실패 시 잠시 후 재시도하게 하거나 예외 발생
      throw new Error(
        'Coupon is currently being processed by another request. Please try again.',
      );
    }

    try {
      // 4. ⭐ [중요] 락 획득 후 최신 상태로 다시 조회하여 동시성 레이스(Race Condition) 방지
      // 엔티티의 usageCount를 최신화하여 validateEligibility에서 정확한 검증이 가능하게 함
      coupon = await this.couponRepository.findById(coupon.id);
      if (!coupon) {
        throw new CouponNotFoundException();
      }

      // 5. 유저별 사용 횟수 및 허용 리스트 확인
      const [userUsageCount, isUserInAllowlist] = await Promise.all([
        this.userCouponRepository.countUserCouponUsage(userId, coupon.id),
        this.couponRepository.isUserInAllowlist(coupon.id, userId),
      ]);

      // 6. 최신 정보를 바탕으로 도메인 엔진 검증 (시간, 수량, 유저별 한도 등)
      coupon.validateEligibility({
        userId,
        userUsageCount,
        isUserInAllowlist,
        now,
      });

      // 7. 쿠폰 상태 변경 및 사용 이력 기록
      coupon.incrementUsage();
      await this.couponRepository.save(coupon);

      const { id: usageRecordId } = this.snowflakeService.generate();
      await this.userCouponRepository.recordUsage({
        id: usageRecordId,
        userId,
        couponId: coupon.id,
        usedAt: now,
      });

      // 8. 보상 지급 (Reward Module 연동)
      for (const reward of coupon.rewards) {
        await this.grantRewardService.execute({
          userId,
          sourceType: RewardSourceType.COUPON,
          sourceId: coupon.id,
          rewardType: reward.rewardType,
          currency: reward.currency,
          amount: reward.amount,
          wageringTargetType: WageringTargetType.AMOUNT,
          wageringMultiplier: reward.wageringMultiplier ?? undefined,
          maxCashConversion: reward.maxCashConversion ?? undefined,
          reason: `Coupon applied: ${coupon.code}`,
        });
      }

      return coupon;
    } finally {
      // 락 해제 (Safety Unlock): 본인이 소유한 락인 경우에만 해제
      await this.redisService.eval(
        `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`,
        1,
        lockKey,
        lockValue,
      );
    }
  }
}
