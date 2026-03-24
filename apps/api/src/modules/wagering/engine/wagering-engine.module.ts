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
  WageringXpIntegrationService,
} from './application/index';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';
import { GamificationCatalogModule } from 'src/modules/gamification/catalog/catalog.module';
import { GamificationCharacterModule } from 'src/modules/gamification/character/character.module';

@Module({
  imports: [
    WalletModule, 
    RequirementModule, 
    WageringConfigModule, 
    AuditLogModule, 
    ConcurrencyModule,
    GamificationCatalogModule,
    GamificationCharacterModule,
  ],

  controllers: [],
  providers: [
    GetAvailableBalanceService,
    ProcessWageringBetService,
    ProcessWageringWinService,
    ProcessWageringCancelService,
    RevertWageringContributionService,
    WageringXpIntegrationService,
  ],
  exports: [
    GetAvailableBalanceService,
    ProcessWageringBetService,
    ProcessWageringWinService,
    ProcessWageringCancelService,
    RevertWageringContributionService,
    WageringXpIntegrationService,
  ],
})
export class WageringEngineModule { }
