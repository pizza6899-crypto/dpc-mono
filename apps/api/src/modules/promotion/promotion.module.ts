// src/modules/promotion/promotion.module.ts
import { Module } from '@nestjs/common';
import { RollingModule } from '../rolling/rolling.module';
import { PromotionPolicy } from './domain';
import { CheckEligiblePromotionsService } from './application/check-eligible-promotions.service';
import { GrantPromotionBonusService } from './application/grant-promotion-bonus.service';
import { FindActivePromotionsService } from './application/find-active-promotions.service';
import { FindUserPromotionsService } from './application/find-user-promotions.service';
import { FindPromotionsAdminService } from './application/find-promotions-admin.service';
import { CreatePromotionService } from './application/create-promotion.service';
import { UpdatePromotionService } from './application/update-promotion.service';
import { DeletePromotionService } from './application/delete-promotion.service';
import { TogglePromotionActiveService } from './application/toggle-promotion-active.service';
import { FindPromotionParticipantsService } from './application/find-promotion-participants.service';
import { GetPromotionStatisticsService } from './application/get-promotion-statistics.service';
import { PromotionRepository } from './infrastructure/promotion.repository';
import { PromotionMapper } from './infrastructure/promotion.mapper';
import { PROMOTION_REPOSITORY } from './ports/out';
import { PromotionUserController } from './controllers/user/promotion-user.controller';
import { PromotionAdminController } from './controllers/admin/promotion-admin.controller';

@Module({
  imports: [RollingModule],
  providers: [
    PromotionPolicy,
    CheckEligiblePromotionsService,
    GrantPromotionBonusService,
    FindActivePromotionsService,
    FindUserPromotionsService,
    FindPromotionsAdminService,
    CreatePromotionService,
    UpdatePromotionService,
    DeletePromotionService,
    TogglePromotionActiveService,
    FindPromotionParticipantsService,
    GetPromotionStatisticsService,
    PromotionMapper,
    {
      provide: PROMOTION_REPOSITORY,
      useClass: PromotionRepository,
    },
  ],
  controllers: [PromotionUserController, PromotionAdminController],
  exports: [
    GrantPromotionBonusService,
    CheckEligiblePromotionsService,
    FindActivePromotionsService,
  ],
})
export class PromotionModule {}

