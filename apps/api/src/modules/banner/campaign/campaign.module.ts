import { Module } from '@nestjs/common';
// Application
// TODO: import services from ./application

// Infrastructure
// TODO: import { BannerRepository, BannerMapper } from './infrastructure';

// Ports
// TODO: import { BANNER_REPOSITORY } from './ports';

// Controllers
// TODO: import { BannerUserController, BannerAdminController } from './controllers';

@Module({
  imports: [],
  providers: [
    // TODO: add application services
    // TODO: add { provide: BANNER_REPOSITORY, useClass: BannerRepository }
  ],
  controllers: [
    // TODO: BannerUserController, BannerAdminController
  ],
  exports: [
    // TODO: export services and mappers
  ],
})
export class BannerCampaignModule {}