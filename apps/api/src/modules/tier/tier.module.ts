import { Module } from '@nestjs/common';
import { TierConfigModule } from './config/tier-config.module';
import { TierProfileModule } from './profile/tier-profile.module';
import { TierEvaluatorModule } from './evaluator/tier-evaluator.module';
import { TierAuditModule } from './audit/tier-audit.module';

@Module({
  imports: [
    TierConfigModule,
    TierProfileModule,
    TierEvaluatorModule,
    TierAuditModule,
  ],
  exports: [
    TierConfigModule,
    TierProfileModule,
    TierEvaluatorModule,
    TierAuditModule,
  ],
})
export class TierModule {}
