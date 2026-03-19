import { Module } from '@nestjs/common';
import { WalletModule } from 'src/modules/wallet/wallet.module';
import { RequirementModule } from '../requirement/requirement.module';
import { GetAvailableBalanceService } from './application/get-available-balance.service';

@Module({
  imports: [WalletModule, RequirementModule],
  controllers: [],
  providers: [GetAvailableBalanceService],
  exports: [GetAvailableBalanceService],
})
export class WageringEngineModule { }
