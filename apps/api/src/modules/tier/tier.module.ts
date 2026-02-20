import { Module } from '@nestjs/common';
import { TierDefinitionsModule } from './definitions/tier-definitions.module';
import { TierProfileModule } from './profile/tier-profile.module';
import { TierEvaluatorModule } from './evaluator/tier-evaluator.module';
import { TierAuditModule } from './audit/tier-audit.module';
import { TierRewardModule } from './reward/tier-reward.module';

@Module({
  imports: [
    TierDefinitionsModule,
    TierProfileModule,
    TierEvaluatorModule,
    TierAuditModule,
    TierRewardModule,
  ],
  exports: [
    TierDefinitionsModule,
    TierProfileModule,
    TierEvaluatorModule,
    TierAuditModule,
    TierRewardModule,
  ],
})
export class TierModule {}
