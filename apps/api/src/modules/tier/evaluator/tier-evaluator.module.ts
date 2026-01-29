import { Module, forwardRef } from '@nestjs/common';
import { TierProfileModule } from '../profile/tier-profile.module';
import { TierAuditModule } from '../audit/tier-audit.module';
import { PromotionPolicy } from './domain/promotion.policy';
import { DemotionPolicy } from './domain/demotion.policy';
import { PromotionService } from './application/promotion.service';
import { AccumulateRollingService } from './application/accumulate-rolling.service';
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
        AccumulateRollingService,
        BatchEvaluationService,
    ],
    exports: [AccumulateRollingService, BatchEvaluationService],
})
export class TierEvaluatorModule { }
