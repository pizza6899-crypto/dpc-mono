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
import { ConcurrencyModule } from 'src/infrastructure/concurrency/concurrency.module';
import { CharacterMasterModule } from 'src/modules/character/master/master.module';
import { CharacterStatusModule } from 'src/modules/character/status/status.module';

@Module({
  imports: [
    WalletModule,
    RequirementModule,
    WageringConfigModule,
    AuditLogModule,
    ConcurrencyModule,
    CharacterMasterModule,
    CharacterStatusModule,
  ],

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
