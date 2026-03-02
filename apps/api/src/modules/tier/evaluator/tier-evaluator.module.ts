import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TierProfileModule } from '../profile/tier-profile.module';
import { TierAuditModule } from '../audit/tier-audit.module';
import { PromotionPolicy } from './domain/promotion.policy';
import { DemotionPolicy } from './domain/demotion.policy';
import { PromoteUserTierService } from './application/promote-user-tier.service';
import { DemoteUserTierService } from './application/demote-user-tier.service';
import { AccumulateUserRollingService } from './application/accumulate-user-rolling.service';
import { AccumulateUserDepositService } from './application/accumulate-user-deposit.service';
import { EvaluateUserTierService } from './application/evaluate-user-tier.service';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';
import { BullMqModule } from 'src/infrastructure/bullmq/bullmq.module';
import { TIER_EVALUATOR_QUEUES } from './infrastructure/tier-evaluator.bullmq';
import { TierEvaluationTriggerProcessor } from './infrastructure/tier-evaluation-trigger.processor';
import { TierUserEvaluationProcessor } from './infrastructure/tier-user-evaluation.processor';
import { TierConfigModule } from '../config/tier-config.module';
import { RewardCoreModule } from 'src/modules/reward/core/reward-core.module';

@Module({
  imports: [
    forwardRef(() => TierProfileModule),
    TierConfigModule,
    RewardCoreModule,
    TierAuditModule,
    ConcurrencyModule,
    BullMqModule,
    BullModule.registerQueue(
      { name: TIER_EVALUATOR_QUEUES.EVALUATION_TRIGGER.name },
      { name: TIER_EVALUATOR_QUEUES.USER_EVALUATION.name },
    ),
  ],
  providers: [
    PromotionPolicy,
    DemotionPolicy,
    PromoteUserTierService,
    DemoteUserTierService,
    AccumulateUserRollingService,
    AccumulateUserDepositService,
    EvaluateUserTierService,
    TierEvaluationTriggerProcessor,
    TierUserEvaluationProcessor,
  ],
  exports: [
    AccumulateUserRollingService,
    AccumulateUserDepositService,
    EvaluateUserTierService,
    DemoteUserTierService,
  ],
})
export class TierEvaluatorModule {}
