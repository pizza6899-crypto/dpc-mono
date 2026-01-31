import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TierProfileModule } from '../profile/tier-profile.module';
import { TierAuditModule } from '../audit/tier-audit.module';
import { PromotionPolicy } from './domain/promotion.policy';
import { DemotionPolicy } from './domain/demotion.policy';
import { PromotionService } from './application/promotion.service';
import { DemotionService } from './application/demotion.service';
import { AccumulateRollingService } from './application/accumulate-rolling.service';
import { AccumulateDepositService } from './application/accumulate-deposit.service';
import { TierEvaluationService } from './application/tier-evaluation.service';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';
import { BullMqModule } from 'src/infrastructure/bullmq/bullmq.module';
import { TIER_EVALUATOR_QUEUES } from './infrastructure/tier-evaluator.bullmq';
import { TierEvaluationTriggerProcessor } from './infrastructure/tier-evaluation-trigger.processor';
import { TierUserEvaluationProcessor } from './infrastructure/tier-user-evaluation.processor';
import { TierMasterModule } from '../master/tier-master.module';

@Module({
    imports: [
        forwardRef(() => TierProfileModule),
        TierMasterModule,
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
        PromotionService,
        DemotionService,
        AccumulateRollingService,
        AccumulateDepositService,
        TierEvaluationService,
        TierEvaluationTriggerProcessor,
        TierUserEvaluationProcessor,
    ],
    exports: [AccumulateRollingService, AccumulateDepositService, TierEvaluationService, DemotionService],
})
export class TierEvaluatorModule { }
