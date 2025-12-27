import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/platform/prisma/prisma.module';
import { ConcurrencyModule } from 'src/platform/concurrency/concurrency.module';
import { ActivityLogModule } from 'src/platform/activity-log/activity-log.module';
import { RollingModule } from '../rolling/rolling.module';
import { PromotionService } from './application/promotion.service';
import { PromotionBonusService } from './application/promotion-bonus.service';
import { PromotionTranslationService } from './application/promotion-translation.service';
import { PromotionController } from './controllers/promotion.controller';
import { PromotionTranslationAdminController } from './controllers/promotion-translation-admin.controller';

@Module({
  imports: [PrismaModule, ConcurrencyModule, ActivityLogModule, RollingModule],
  providers: [
    PromotionService,
    PromotionBonusService,
    PromotionTranslationService,
  ],
  controllers: [PromotionController, PromotionTranslationAdminController],
  exports: [
    PromotionService,
    PromotionBonusService,
    PromotionTranslationService,
  ],
})
export class PromotionModule {}
