// src/modules/promotion/promotion.module.ts
import { Module } from '@nestjs/common';
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
import { GetActivePromotionsForUserService } from './application/get-active-promotions-for-user.service';
import { GetPromotionByIdForUserService } from './application/get-promotion-by-id-for-user.service';
import { PromotionRepository } from './infrastructure/promotion.repository';
import { PromotionMapper } from './infrastructure/promotion.mapper';
import { PROMOTION_REPOSITORY } from './ports/out';
import { PromotionUserController } from './controllers/user/promotion-user.controller';
import { PromotionAdminController } from './controllers/admin/promotion-admin.controller';
import { WageringModule } from '../wagering/wagering.module';

@Module({
  imports: [WageringModule],
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
    GetActivePromotionsForUserService,
    GetPromotionByIdForUserService,
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
export class PromotionModule { }

