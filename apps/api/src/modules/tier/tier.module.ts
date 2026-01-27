import { Module } from '@nestjs/common';
import { TierMasterModule } from './master/tier-master.module';
import { TierProfileModule } from './profile/tier-profile.module';
import { TierEvaluatorModule } from './evaluator/tier-evaluator.module';
import { TierAuditModule } from './audit/tier-audit.module';

@Module({
    imports: [
        TierMasterModule,
        TierProfileModule,
        TierEvaluatorModule,
        TierAuditModule,
    ],
    exports: [
        TierMasterModule,
        TierProfileModule,
        TierEvaluatorModule,
        TierAuditModule,
    ],
})
export class TierModule { }
