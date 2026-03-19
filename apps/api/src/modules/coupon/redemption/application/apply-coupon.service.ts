import { Injectable, Inject } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { PrismaTransactionalAdapter } from 'src/infrastructure/prisma/prisma.module';
import { RewardSourceType, WageringTargetType, ExchangeCurrencyCode } from '@prisma/client';
import { COUPON_REPOSITORY_TOKEN } from '../../core/ports/coupon.repository.token';
import type { CouponRepositoryPort } from '../../core/ports/coupon.repository.port';
import {
  USER_COUPON_REPOSITORY_TOKEN,
  type UserCouponRepositoryPort,
} from '../ports/user-coupon.repository.port';
import { InstantGrantRewardService } from 'src/modules/reward/core/application/instant-grant-reward.service';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import { RedisService } from 'src/infrastructure/redis/redis.service';
import { GetCouponConfigService } from '../../config/application/get-coupon-config.service';
import { CouponNotFoundException, CouponCurrencyMismatchException } from '../../core/domain/coupon.exception';
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
    @Inject(USER_COUPON_REPOSITORY_TOKEN)
    private readonly userCouponRepository: UserCouponRepositoryPort,
    private readonly instantGrantRewardService: InstantGrantRewardService,
    private readonly snowflakeService: SnowflakeService,
    private readonly redisService: RedisService,
    private readonly getCouponConfigService: GetCouponConfigService,
    private readonly txHost: TransactionHost<PrismaTransactionalAdapter>,
  ) { }

  private readonly logger = new Logger(ApplyCouponService.name);

  async execute(
    userId: bigint,
    code: string,
    userCurrency: ExchangeCurrencyCode,
  ): Promise<Coupon> {
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
    const attemptKey = `coupon:attempts:user:${userId}:${dateKey}`;

    // 1. 글로벌 설정 확인 및 시도 횟수 제한 체크
    const config = await this.getCouponConfigService.execute();
    if (!config.isCouponEnabled) {
      throw new CouponSystemDisabledException();
    }

    // 시도 횟수 증가 및 체크 (Lua 스크립트를 사용하여 원자성 확보)
    const incrScript = `
      local current = redis.call("INCR", KEYS[1])
      if current == 1 then
        redis.call("EXPIRE", KEYS[1], 86400)
      end
      return current
    `;
    const currentAttempts = await this.redisService.eval(incrScript, 1, attemptKey);

    if (currentAttempts > config.maxDailyAttemptsPerUser) {
      throw new CouponDailyAttemptsExceededException();
    }

    // 2. 쿠폰 조회 (캐시 또는 간단한 조회 가능성 대비)
    let coupon = await this.couponRepository.findByCode(code);
    if (!coupon) {
      throw new CouponNotFoundException();
    }

    // 3. 동시성 제어를 위한 Redis 분산 락 (쿠폰 ID 기준)
    // 💡 Lock -> Transaction -> Commit -> Unlock 순서를 보장하여 데이터 정합성 유지
    const lockKey = `lock:coupon:apply:${coupon.id}`;
    const lockValue = this.snowflakeService.generate().id.toString();
    const acquired = await this.redisService.setLock(lockKey, lockValue, 10); // 10초 락

    if (!acquired) {
      throw new Error(
        'Coupon is currently being processed. Please try again in a moment.',
      );
    }

    try {
      // 4. 트랜잭션 내부에서 정합성 보장 로직 수행
      return await this.txHost.withTransaction(async () => {
        // 락 획득 후 최신 상태로 다시 조회하여 Race Condition 방지
        const currentCouponId = coupon!.id; // line 65에서 null 체크됨
        coupon = await this.couponRepository.findById(currentCouponId);
        if (!coupon) {
          throw new CouponNotFoundException();
        }

        // 5. 유저별 사용 횟수 및 허용 리스트 확인
        const [userUsageCount, isUserInAllowlist] = await Promise.all([
          this.userCouponRepository.countUserCouponUsage(userId, coupon.id),
          this.couponRepository.isUserInAllowlist(coupon.id, userId),
        ]);

        // 6. 엔티티 레벨 유효성 검증
        coupon.validateEligibility({
          userId,
          userUsageCount,
          isUserInAllowlist,
          now,
        });

        // ⭐ [추가 로직] 유저의 대표 통화와 일치하는 보상만 필터링
        const matchedRewards = coupon.rewards.filter(
          (r) => r.currency === userCurrency,
        );

        if (matchedRewards.length === 0) {
          throw new CouponCurrencyMismatchException();
        }

        // 7. 사용 처리 및 이력 기록
        coupon.incrementUsage();
        const savedCoupon = await this.couponRepository.save(coupon);

        const { id: usageRecordId } = this.snowflakeService.generate();
        await this.userCouponRepository.recordUsage({
          id: usageRecordId,
          userId,
          couponId: coupon.id,
          usedAt: now,
        });

        // 8. 보상 즉시 지급 및 수령 (Reward Module - Instant Grant)
        for (const reward of matchedRewards) {
          await this.instantGrantRewardService.execute({
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

        return savedCoupon;
      });
    } finally {
      // 9. Safety Unlock: 본인 소유의 락만 해제
      await this.redisService.eval(
        `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`,
        1,
        lockKey,
        lockValue,
      );
    }
  }
}
