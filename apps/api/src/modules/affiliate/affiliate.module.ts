// src/modules/affiliate/affiliate.module.ts
import { Module } from '@nestjs/common';
import { AffiliateCodeModule } from './code/code.module';
import { AffiliateReferralModule } from './referral/referral.module';
import { AffiliateCommissionModule } from './commission/commission.module';

@Module({
  imports: [
    AffiliateCodeModule,
    AffiliateReferralModule,
    AffiliateCommissionModule,
  ],
  controllers: [],
  providers: [],
  exports: [
    AffiliateCodeModule,
    AffiliateReferralModule,
    AffiliateCommissionModule,
  ],
})
export class AffiliateModule { }
