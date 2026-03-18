import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DomainException } from '../../../common/exception/domain.exception';
import { MessageCode } from '../../../../shared/src/constants/message-codes';
import { GetCouponConfigService } from '../../config/application/get-coupon-config.service';
import { COUPON_REPOSITORY_TOKEN } from '../../core/ports/coupon.repository.token';
import { CouponRepositoryPort } from '../../core/ports/coupon.repository.port';
import { USER_COUPON_REPOSITORY_TOKEN } from '../ports/user-coupon.repository.token';
import { UserCouponRepositoryPort } from '../ports/user-coupon.repository.port';
import { RedemptionPolicy } from '../domain/redemption-policy';
import { InstantGrantRewardService } from '../../../reward/core/application/instant-grant-reward.service';
import { RewardSourceType } from '@prisma/client';

@Injectable()
export class ApplyCouponService {
  constructor(
    private readonly getCouponConfigService: GetCouponConfigService,
    @Inject(COUPON_REPOSITORY_TOKEN)
    private readonly couponRepository: CouponRepositoryPort,
    @Inject(USER_COUPON_REPOSITORY_TOKEN)
    private readonly userCouponRepository: UserCouponRepositoryPort,
    private readonly instantGrantRewardService: InstantGrantRewardService,
  ) {}

  async execute(userId: bigint, code: string): Promise<void> {
    // 1. 전역 설정 확인
    const config = await this.getCouponConfigService.execute();
    if (!config.isCouponEnabled) {
      throw new DomainException(MessageCode.COUPON_SYSTEM_DISABLED);
    }

    // 2. 쿠폰 및 리워드 사양 조회
    const coupon = await this.couponRepository.findByCode(code);
    if (!coupon) {
      throw new DomainException(MessageCode.COUPON_NOT_FOUND);
    }

    // 3. 유저 사용 이력 및 화이트리스트 상태 조회
    const [userUsageCount, isUserInAllowlist] = await Promise.all([
      this.userCouponRepository.countByUserAndCoupon(userId, coupon.id),
      this.couponRepository.checkAllowlist(coupon.id, userId),
    ]);

    // 4. 도메인 정책 검증
    RedemptionPolicy.validate(coupon, userId, userUsageCount, isUserInAllowlist);

    // 5. 쿠폰 사용 처리 (트랜잭션)
    // [사용 횟수 증가 + 이력 생성 + 리워드 지급]
    await this.couponRepository.transaction(async (tx) => {
      // 5-1. 쿠폰 사용 횟수 증가
      await this.couponRepository.incrementUsageCount(coupon.id, tx);

      // 5-2. 사용 이력(UserCoupon) 생성
      const userCouponId = await this.userCouponRepository.create({
        couponId: coupon.id,
        userId: userId,
      }, tx);

      // 5-3. 리워드 지급 (1:N 보상 처리)
      for (const rewardSpec of coupon.rewards) {
        await this.instantGrantRewardService.execute({
          userId,
          sourceType: RewardSourceType.COUPON,
          sourceId: userCouponId,
          rewardType: rewardSpec.rewardType,
          currency: rewardSpec.currency,
          amount: rewardSpec.amount,
          wageringMultiplier: rewardSpec.wageringMultiplier,
          maxCashConversion: rewardSpec.maxCashConversion,
        }, tx);
      }
    });
  }
}
