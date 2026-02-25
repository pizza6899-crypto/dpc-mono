import { Injectable, Logger } from '@nestjs/common';
import { UserTierRepositoryPort } from '../../profile/infrastructure/user-tier.repository.port';
import { TierRepositoryPort } from '../../config/infrastructure/tier.repository.port';
import { PromotionPolicy } from '../domain/promotion.policy';
import { PromoteUserTierService } from './promote-user-tier.service';
import { Transactional } from '@nestjs-cls/transactional';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { UserTier } from '../../profile/domain/user-tier.entity';

@Injectable()
export class AccumulateUserRollingService {
  private readonly logger = new Logger(AccumulateUserRollingService.name);

  constructor(
    private readonly userTierRepository: UserTierRepositoryPort,
    private readonly tierRepository: TierRepositoryPort,
    private readonly promotionPolicy: PromotionPolicy,
    private readonly promoteUserTierService: PromoteUserTierService,
    private readonly advisoryLockService: AdvisoryLockService,
  ) {}

  @Transactional()
  async execute(userId: bigint, amountUsd: number): Promise<void> {
    if (amountUsd <= 0) return;

    try {
      // 0. 동시성 제어 (UserTier 락 획득)
      await this.advisoryLockService.acquireLock(
        LockNamespace.USER_TIER,
        userId.toString(),
      );

      // 1. 원자적 처리 (Repository 메서드 사용 - 업데이트된 최신 상태 반환)
      // NOTE: 도메인 엔티티를 로드하여 변경(UserTier.increment...)하는 것이 정석이나,
      // 롤링 누적은 빈번히 발생하는 이벤트이므로 DB Atomic Update를 사용하여 성능을 최적화함.
      // Advisory Lock을 통해 동시성 문제를 제어하며, 반환된 최신 상태로 승급을 심사함.
      const updatedUserTier = await this.userTierRepository.incrementRolling(
        userId,
        amountUsd,
      );

      // 2. 비동기 승급 심사 (최신 상태 기반으로 즉시 심사)
      await this.attemptPromotion(updatedUserTier);
    } catch (error) {
      this.logger.error(`Failed to accumulate rolling: ${error.message}`);
      throw error;
    }
  }

  private async attemptPromotion(userTier: UserTier): Promise<void> {
    if (!userTier.tier) return; // 티어 정보가 로드되지 않았으면 스킵

    const allTiers = await this.tierRepository.findAll();
    const nextTier = this.promotionPolicy.findEligibleTier(userTier, allTiers);

    if (nextTier) {
      await this.promoteUserTierService.execute(userTier.userId, nextTier);
    }
  }
}
