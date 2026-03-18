import { Module } from '@nestjs/common';
import { PromotionCampaignModule } from './campaign/campaign.module';
import { PromotionConfigModule } from './config/promotion-config.module';

@Module({
  imports: [PromotionCampaignModule, PromotionConfigModule],
  exports: [PromotionCampaignModule, PromotionConfigModule],
})
export class PromotionModule { }
