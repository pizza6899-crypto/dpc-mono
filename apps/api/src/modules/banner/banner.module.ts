import { Module } from '@nestjs/common';
import { BannerCampaignModule } from './campaign/campaign.module';

@Module({
  imports: [BannerCampaignModule],
})
export class BannerModule {}
