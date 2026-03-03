import { Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { UserTierRepositoryPort } from '../../profile/infrastructure/user-tier.repository.port';
import { DemotionPolicy } from '../domain/demotion.policy';
import { DemoteUserTierService } from './demote-user-tier.service';
import { TierStatsService } from '../../audit/application/tier-stats.service';
import { Tier } from '../../config/domain/tier.entity';
import { TierEvaluationCycle } from '@prisma/client';
import { TierConfigRepositoryPort } from '../../config/infrastructure/tier-config.repository.port';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';

@Injectable()
export class EvaluateUserTierService {
  private readonly logger = new Logger(EvaluateUserTierService.name);

  constructor(
    private readonly userTierRepository: UserTierRepositoryPort,
    private readonly tierConfigRepository: TierConfigRepositoryPort,
    private readonly demotionPolicy: DemotionPolicy,
    private readonly demoteUserTierService: DemoteUserTierService,
    private readonly tierStatsService: TierStatsService,
    private readonly advisoryLockService: AdvisoryLockService,
  ) { }

  @Transactional()
  async evaluateUser(userId: bigint, allTiers: Tier[]): Promise<void> {
    // [Concurrency Control] 정기 심사 중 실적 누적과의 충돌 방지
    await this.advisoryLockService.acquireLock(
      LockNamespace.USER_TIER,
      userId.toString(),
    );

    const userTier = await this.userTierRepository.findByUserId(userId);
    if (!userTier || !userTier.tier) return;

    // 1. 글로벌 강등 설정 확인
    const config = await this.tierConfigRepository.find();
    const isDowngradeDisabled = config?.isDowngradeEnabled === false;
    const gracePeriodDays = config?.defaultDowngradeGracePeriodDays ?? 7;

    let result = this.demotionPolicy.evaluate(
      userTier,
      allTiers,
      gracePeriodDays,
    );

    // 강등이 비활성화된 경우, 어떤 결과가 나오더라도 MAINTAIN으로 강제 전환
    if (isDowngradeDisabled && result.action !== 'MAINTAIN') {
      this.logger.debug(
        `Downgrade is disabled globally (isDowngradeEnabled=false). Overriding evaluation result for user ${userId} to MAINTAIN.`,
      );
      result = { action: 'MAINTAIN' };
    }

    switch (result.action) {
      case 'MAINTAIN':
        const maintainDays = this.getCycleDays(userTier.tier.evaluationCycle);
        userTier.resetPeriodPerformance(maintainDays);
        await this.userTierRepository.save(userTier);

        // [추가] 통계 누적: 유지 인원
        await this.tierStatsService.increment(new Date(), userTier.tierId, {
          maintainedCount: 1,
        });
        break;
      case 'GRACE':
        if (result.targetTier) {
          userTier.setDowngradeWarning(
            result.targetTier.id,
            result.graceEndsAt!,
          );
        }
        await this.userTierRepository.save(userTier);

        // [추가] 통계 누적: 유예 대상 인원
        await this.tierStatsService.increment(new Date(), userTier.tierId, {
          graceCount: 1,
        });
        break;
      case 'DEMOTE':
        const demotedDays = this.getCycleDays(
          result.targetTier!.evaluationCycle,
        );

        await this.demoteUserTierService.execute(
          userId,
          result.targetTier!,
          demotedDays,
          'Failed to meet maintenance requirements after grace period',
        );
        break;
    }
  }

  private getCycleDays(cycle: TierEvaluationCycle): number {
    switch (cycle) {
      case TierEvaluationCycle.ROLLING_30_DAYS:
        return 30;
      case TierEvaluationCycle.ROLLING_90_DAYS:
        return 90;
      case TierEvaluationCycle.NONE:
        return 0; // 0으로 전달하여 nextEvaluationAt을 null로 설정
      default:
        return 30;
    }
  }
}
