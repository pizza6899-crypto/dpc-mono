import { Module, forwardRef } from '@nestjs/common';
import { TierProfileModule } from '../profile/tier-profile.module';
import { TierAuditModule } from '../audit/tier-audit.module';
import { PromotionPolicy } from './domain/promotion.policy';
import { DemotionPolicy } from './domain/demotion.policy';
import { PromotionService } from './application/promotion.service';
import { DemotionService } from './application/demotion.service';
import { AccumulateRollingService } from './application/accumulate-rolling.service';
import { AccumulateDepositService } from './application/accumulate-deposit.service';
import { BatchEvaluationService } from './application/batch-evaluation.service';

@Module({
    imports: [
        forwardRef(() => TierProfileModule),
        TierAuditModule,
    ],
    providers: [
        PromotionPolicy,
        DemotionPolicy,
        PromotionService,
        DemotionService,
        AccumulateRollingService,
        AccumulateDepositService,
        BatchEvaluationService,
    ],
    exports: [AccumulateRollingService, AccumulateDepositService, BatchEvaluationService, DemotionService],
})
export class TierEvaluatorModule { }
