import { Module } from '@nestjs/common';
import { MetricModule } from './metric/metric.module';
import { ScoringModule } from './scoring/scoring.module';
import { PolicyModule } from './policy/policy.module';
import { HistoryModule } from './history/history.module';

@Module({
  imports: [
    MetricModule,
    ScoringModule,
    PolicyModule,
    HistoryModule,
  ],
  exports: [MetricModule, ScoringModule],
})
export class UserIntelligenceModule { }
