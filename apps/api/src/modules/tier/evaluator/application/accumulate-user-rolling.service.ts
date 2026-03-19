import { Injectable, Logger } from '@nestjs/common';
import { UserTierRepositoryPort } from '../../profile/infrastructure/user-tier.repository.port';
import { TierRepositoryPort } from '../../config/infrastructure/tier.repository.port';
import { PromotionPolicy } from '../domain/promotion.policy';
import { PromoteUserTierService } from './promote-user-tier.service';
import { TierStatsService } from '../../audit/application/tier-stats.service';
import { Transactional } from '@nestjs-cls/transactional';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { UserTier } from '../../profile/domain/user-tier.entity';
import { TierConfigRepositoryPort } from '../../config/infrastructure/tier-config.repository.port';
import { TierAuditRepositoryPort } from '../../audit/infrastructure/tier-audit.repository.port';
import { ExpSourceType, Prisma } from '@prisma/client';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';

@Injectable()
export class AccumulateUserRollingService {
  private readonly logger = new Logger(AccumulateUserRollingService.name);

  constructor(
    private readonly userTierRepository: UserTierRepositoryPort,
    private readonly tierRepository: TierRepositoryPort,
    private readonly tierConfigRepository: TierConfigRepositoryPort,
    private readonly promotionPolicy: PromotionPolicy,
    private readonly promoteUserTierService: PromoteUserTierService,
    private readonly tierAuditRepository: TierAuditRepositoryPort,
    private readonly tierStatsService: TierStatsService,
    private readonly snowflakeService: SnowflakeService,
    private readonly advisoryLockService: AdvisoryLockService,
  ) {}

  @Transactional()
  async execute(
    userId: bigint,
    amountUsd: number,
    reference?: { sourceType: ExpSourceType; referenceId: bigint },
  ): Promise<void> {
    if (amountUsd <= 0) return;

    try {
      // 0. 동시성 제어 (UserTier 락 획득)
      await this.advisoryLockService.acquireLock(
        LockNamespace.USER_TIER,
        userId.toString(),
      );

      // 1. XP 환산 (Config 기반)
      const config = await this.tierConfigRepository.find();
      const expGrantRollingUsd = config?.expGrantRollingUsd?.toNumber() || 1.0;
      const expToGrant = Math.floor(amountUsd / expGrantRollingUsd);

      if (expToGrant <= 0) {
        this.logger.debug(
          `Amount ${amountUsd} is too small to grant XP (Required: ${expGrantRollingUsd}). Skipping.`,
        );
        return;
      }

      // 2. 원자적 처리 (XP 누적)
      const updatedUserTier = await this.userTierRepository.incrementExp(
        userId,
        BigInt(expToGrant),
      );

      // 3. XP 로그 기록
      const snowflake = this.snowflakeService.generate();
      await this.tierAuditRepository.saveExpLog({
        id: snowflake.id,
        userId,
        amount: BigInt(expToGrant),
        statusExpSnap: updatedUserTier.statusExp,
        sourceType: reference?.sourceType ?? ExpSourceType.ROLLING_REWARD,
        referenceId: reference?.referenceId,
        createdAt: snowflake.timestamp,
      });

      // 4. 실시간 통계 갱신 (지급된 XP 및 롤링액 누적)
      await this.tierStatsService.increment(
        snowflake.timestamp,
        updatedUserTier.tierId,
        {
          periodExpGranted: BigInt(expToGrant),
          periodTotalRollingUsd: new Prisma.Decimal(amountUsd),
        },
      );

      // 5. 비동기 승급 심사 (최신 상태 기반으로 즉시 심사)
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
