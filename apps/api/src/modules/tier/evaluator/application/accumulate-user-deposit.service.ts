import { Injectable, Logger } from '@nestjs/common';
import { UserTierRepositoryPort } from '../../profile/infrastructure/user-tier.repository.port';
import { TierRepositoryPort } from '../../config/infrastructure/tier.repository.port';
import { PromotionPolicy } from '../domain/promotion.policy';
import { PromoteUserTierService } from './promote-user-tier.service';
import { Transactional } from '@nestjs-cls/transactional';

import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { UserTier } from '../../profile/domain/user-tier.entity';

@Injectable()
export class AccumulateUserDepositService {
  private readonly logger = new Logger(AccumulateUserDepositService.name);

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

      // 1. 입금 실적 누적 (업데이트된 최신 상태 반환)
      // NOTE: 도메인 엔티티를 로드하여 변경(UserTier.increment...)하는 것이 정석이나,
      // 빈번한 이벤트에 대한 성능 최적화를 위해 DB Atomic Update를 사용함.
      const updatedUserTier = await this.userTierRepository.incrementDeposit(
        userId,
        amountUsd,
      );

      // 2. 승급 심사 (최신 상태 기반으로 즉시 심사)
      await this.attemptPromotion(updatedUserTier);
    } catch (error) {
      this.logger.error(`Failed to accumulate deposit: ${error.message}`);
      throw error;
    }
  }

  private async attemptPromotion(userTier: UserTier): Promise<void> {
    if (!userTier.tier) return;

    const allTiers = await this.tierRepository.findAll();
    const nextTier = this.promotionPolicy.findEligibleTier(userTier, allTiers);

    if (nextTier) {
      await this.promoteUserTierService.execute(
        userTier.userId,
        nextTier,
        'Automatic promotion (Deposit met requirement)',
      );
    }
  }
}
