import { Module } from '@nestjs/common';
import { TierProfileModule } from '../profile/tier-profile.module';
import { TierAuditModule } from '../audit/tier-audit.module';
import { PromotionPolicy } from './domain/promotion.policy';
import { DemotionPolicy } from './domain/demotion.policy';
import { PromotionService } from './application/promotion.service';
import { AccumulateRollingService } from './application/accumulate-rolling.service';
import { BatchEvaluationService } from './application/batch-evaluation.service';
import { TierDemotionWarningRepositoryPort } from './infrastructure/evaluator.repository.port';
import { TierDemotionWarningRepository } from './infrastructure/tier-evaluator.repository';

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
        BatchEvaluationService,
        { provide: TierDemotionWarningRepositoryPort, useClass: TierDemotionWarningRepository },
    ],
    exports: [AccumulateRollingService, BatchEvaluationService, TierDemotionWarningRepositoryPort],
})
export class TierEvaluatorModule { }
