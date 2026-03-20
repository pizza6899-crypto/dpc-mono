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
} from './application/index';

@Module({
  imports: [WalletModule, RequirementModule, WageringConfigModule, AuditLogModule],
  controllers: [],
  providers: [
    GetAvailableBalanceService,
    ProcessWageringBetService,
    ProcessWageringWinService,
    ProcessWageringCancelService,
  ],
  exports: [
    GetAvailableBalanceService,
    ProcessWageringBetService,
    ProcessWageringWinService,
    ProcessWageringCancelService,
  ],
})
export class WageringEngineModule { }
