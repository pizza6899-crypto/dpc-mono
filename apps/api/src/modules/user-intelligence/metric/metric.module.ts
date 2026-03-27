import { Module } from '@nestjs/common';
import { UserIntelligenceCalculatorService } from './application/user-intelligence-calculator.service';
import { RefreshUserIntelligenceService } from './application/refresh-user-intelligence.service';
import { PrismaMetricRepository } from './infrastructure/prisma-metric.repository';
import {
  CASINO_METRIC_PORT,
  USER_ACTIVITY_METRIC_PORT,
  USER_INTELLIGENCE_SCORE_PORT,
  WALLET_METRIC_PORT,
} from './ports';
import { PolicyModule } from '../policy/policy.module';
import { HistoryModule } from '../history/history.module';

@Module({
  imports: [PolicyModule, HistoryModule],
  providers: [
    UserIntelligenceCalculatorService,
    RefreshUserIntelligenceService,
    {
      provide: USER_ACTIVITY_METRIC_PORT,
      useClass: PrismaMetricRepository,
    },
    {
      provide: CASINO_METRIC_PORT,
      useClass: PrismaMetricRepository,
    },
    {
      provide: WALLET_METRIC_PORT,
      useClass: PrismaMetricRepository,
    },
    {
      provide: USER_INTELLIGENCE_SCORE_PORT,
      useClass: PrismaMetricRepository,
    },
  ],
  exports: [RefreshUserIntelligenceService, UserIntelligenceCalculatorService],
})
export class MetricModule { }
