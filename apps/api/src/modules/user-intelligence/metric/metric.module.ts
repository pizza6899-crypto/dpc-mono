import { Module } from '@nestjs/common';
import { UserIntelligenceCalculatorService } from './application/user-intelligence-calculator.service';
import { UserIntelligenceMetricService } from './application/user-intelligence-metric.service';
import { PrismaMetricRepository } from './infrastructure/prisma-metric.repository';
import {
  CASINO_METRIC_PORT,
  USER_ACTIVITY_METRIC_PORT,
  USER_INTELLIGENCE_SCORE_PORT,
  WALLET_METRIC_PORT,
} from './ports';

@Module({
  providers: [
    UserIntelligenceCalculatorService,
    UserIntelligenceMetricService,
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
  exports: [UserIntelligenceMetricService],
})
export class MetricModule { }
