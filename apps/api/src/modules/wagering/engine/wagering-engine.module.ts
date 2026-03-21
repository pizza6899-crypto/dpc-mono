import { Module } from '@nestjs/common';
import { WalletModule } from 'src/modules/wallet/wallet.module';
import { RequirementModule } from '../requirement/requirement.module';
import { WageringConfigModule } from '../config/wagering-config.module';
import { AuditLogModule } from 'src/modules/audit-log/audit-log.module';
import {
  GetAvailableBalanceService,
  ProcessWageringBetService,
  ProcessWageringWinService,
  ProcessWageringCancelService,
  RevertWageringContributionService,
} from './application/index';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';

@Module({
  imports: [WalletModule, RequirementModule, WageringConfigModule, AuditLogModule, ConcurrencyModule],

  controllers: [],
  providers: [
    GetAvailableBalanceService,
    ProcessWageringBetService,
    ProcessWageringWinService,
    ProcessWageringCancelService,
    RevertWageringContributionService,
  ],
  exports: [
    GetAvailableBalanceService,
    ProcessWageringBetService,
    ProcessWageringWinService,
    ProcessWageringCancelService,
    RevertWageringContributionService,
  ],
})
export class WageringEngineModule { }
