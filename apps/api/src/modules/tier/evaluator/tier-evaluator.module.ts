import { Module } from '@nestjs/common';
import { TierProfileModule } from '../profile/tier-profile.module';
import { TierAuditModule } from '../audit/tier-audit.module';
import { PromotionPolicy } from './domain/promotion.policy';
import { DemotionPolicy } from './domain/demotion.policy';
import { PromotionService } from './application/promotion.service';
import { AccumulateRollingService } from './application/accumulate-rolling.service';

@Module({
    imports: [
        TierProfileModule,
        TierAuditModule,
    ],
    providers: [
        PromotionPolicy,
        DemotionPolicy,
        PromotionService,
        AccumulateRollingService,
    ],
    exports: [AccumulateRollingService],
})
export class TierEvaluatorModule { }
