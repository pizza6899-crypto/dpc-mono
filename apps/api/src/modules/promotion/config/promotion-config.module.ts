import { Module } from '@nestjs/common';
import { GetPromotionConfigService } from './application/get-promotion-config.service';
import { PromotionConfigMapper } from './infrastructure/promotion-config.mapper';
import { PromotionConfigRepository } from './infrastructure/promotion-config.repository';
import { PROMOTION_CONFIG_REPOSITORY } from './ports/promotion-config.repository.port';

@Module({
  providers: [
    GetPromotionConfigService,
    PromotionConfigMapper,
    {
      provide: PROMOTION_CONFIG_REPOSITORY,
      useClass: PromotionConfigRepository,
    },
  ],
  exports: [
    GetPromotionConfigService,
    PROMOTION_CONFIG_REPOSITORY,
  ],
})
export class PromotionConfigModule {}
