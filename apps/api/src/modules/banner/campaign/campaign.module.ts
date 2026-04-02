import { Module } from '@nestjs/common';
import { NotificationModule } from '../../notification/notification.module';
import { FileModule } from '../../file/file.module';

// Domain
import { BannerPolicy } from './domain';

// Application
// TODO: import services from ./application

// Infrastructure
// TODO: import { BannerRepository, BannerMapper } from './infrastructure';

// Ports
// TODO: import { BANNER_REPOSITORY } from './ports';

// Controllers
// TODO: import { BannerUserController, BannerAdminController } from './controllers';

@Module({
  imports: [NotificationModule, FileModule],
  providers: [
    BannerPolicy,
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

































export class BannerCampaignModule {}})  ],    // TODO: export services and mappers  exports: [  ],    // TODO: BannerUserController, BannerAdminController  controllers: [  ],    // TODO: add { provide: BANNER_REPOSITORY, useClass: BannerRepository }    // TODO: add application services    BannerPolicy,  providers: [  imports: [NotificationModule, FileModule],@Module({// TODO: import { BannerUserController, BannerAdminController } from './controllers';// Controllers// TODO: import { BANNER_REPOSITORY } from './ports';// Ports// TODO: import { BannerRepository, BannerMapper } from './infrastructure';// Infrastructure// TODO: import services from ./application// Applicationimport { BannerPolicy } from './domain';// Domainimport { FileModule } from '../../file/file.module';import { NotificationModule } from '../../notification/notification.module';import { BannerCampaignModule } from './campaign.module';

@Module({
  imports: [BannerCampaignModule],
})
export class BannerModule {}
