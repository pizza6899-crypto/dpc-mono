import { Injectable } from '@nestjs/common';
import { UserTierRepositoryPort } from '../infrastructure/user-tier.repository.port';
import { TierEvaluationCycle } from '@prisma/client';
import { UserTierNotFoundException } from '../domain/tier-profile.exception';

@Injectable()
export class ResetUserTierPerformanceService {
  constructor(private readonly userTierRepository: UserTierRepositoryPort) {}

  async execute(userId: bigint): Promise<void> {
    const userTier = await this.userTierRepository.findByUserId(userId);
    if (!userTier || !userTier.tier) {
      throw new UserTierNotFoundException();
    }

    let cycleDays = 30;
    switch (userTier.tier.evaluationCycle) {
      case TierEvaluationCycle.ROLLING_30_DAYS:
        cycleDays = 30;
        break;
      case TierEvaluationCycle.ROLLING_90_DAYS:
        cycleDays = 90;
        break;
      case TierEvaluationCycle.NONE:
        cycleDays = 0;
        break; // 0으로 전달하여 nextEvaluationAt을 null로 설정
      default:
        cycleDays = 30;
        break;
    }

    userTier.resetPeriodPerformance(cycleDays);
    await this.userTierRepository.save(userTier);
  }
}
