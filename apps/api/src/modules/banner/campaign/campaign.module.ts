import { Module } from '@nestjs/common';

// Application
import { FindBannersService } from './application/find-banners.service';
import { GetBannerByIdService } from './application/get-banner-by-id.service';
import { CreateBannerService } from './application/create-banner.service';
import { UpdateBannerService } from './application/update-banner.service';
import { DeleteBannerService } from './application/delete-banner.service';

// Infrastructure
import { BannerRepository } from './infrastructure/banner.repository';
import { BannerMapper } from './infrastructure/banner.mapper';

// Ports
import { BANNER_REPOSITORY } from './ports/banner.repository.port';

// Controllers
import { BannerPublicController } from './controllers/public/banner-public.controller';
import { BannerAdminController } from './controllers/admin/banner-admin.controller';

@Module({
  imports: [],
  providers: [
    BannerMapper,
    {
      provide: BANNER_REPOSITORY,
      useClass: BannerRepository,
    },
    FindBannersService,
    GetBannerByIdService,
    CreateBannerService,
    UpdateBannerService,
    DeleteBannerService,
  ],
  controllers: [BannerPublicController, BannerAdminController],
  exports: [
    FindBannersService,
    GetBannerByIdService,
    CreateBannerService,
    UpdateBannerService,
    DeleteBannerService,
  ],
})
export class BannerCampaignModule {}
