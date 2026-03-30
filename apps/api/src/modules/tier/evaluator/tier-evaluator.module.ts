import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TierProfileModule } from '../profile/tier-profile.module';
import { TierAuditModule } from '../audit/tier-audit.module';
import { PromotionPolicy } from './domain/promotion.policy';
import { DemotionPolicy } from './domain/demotion.policy';
import { PromoteUserTierService } from './application/promote-user-tier.service';
import { DemoteUserTierService } from './application/demote-user-tier.service';
import { AccumulateUserRollingService } from './application/accumulate-user-rolling.service';
import { EvaluateUserTierService } from './application/evaluate-user-tier.service';
import { ConcurrencyModule } from 'src/infrastructure/concurrency/concurrency.module';
import { BullMqModule } from 'src/infrastructure/bullmq/bullmq.module';
import { TIER_EVALUATOR_QUEUES } from './infrastructure/tier-evaluator.bullmq';
import { TierEvaluationTriggerProcessor } from './infrastructure/tier-evaluation-trigger.processor';
import { TierUserEvaluationProcessor } from './infrastructure/tier-user-evaluation.processor';
import { TierConfigModule } from '../config/tier-config.module';
import { RewardCoreModule } from 'src/modules/reward/core/reward-core.module';
import { SnowflakeModule } from 'src/infrastructure/snowflake/snowflake.module';

@Module({
  imports: [
    forwardRef(() => TierProfileModule),
    TierConfigModule,
    RewardCoreModule,
    TierAuditModule,
    ConcurrencyModule,
    BullMqModule,
    SnowflakeModule,
    BullModule.registerQueue(TIER_EVALUATOR_QUEUES.EVALUATION_TRIGGER),
    BullModule.registerQueue(TIER_EVALUATOR_QUEUES.USER_EVALUATION),
  ],
  providers: [
    PromotionPolicy,
    DemotionPolicy,
    PromoteUserTierService,
    DemoteUserTierService,
    AccumulateUserRollingService,
    EvaluateUserTierService,
    TierEvaluationTriggerProcessor,
    TierUserEvaluationProcessor,
  ],
  exports: [
    AccumulateUserRollingService,
    EvaluateUserTierService,
    DemoteUserTierService,
  ],
})
export class TierEvaluatorModule {}
