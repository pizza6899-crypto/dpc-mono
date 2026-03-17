// src/modules/promotion/promotion.module.ts
import { Module } from '@nestjs/common';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';
import { PromotionPolicy } from './domain';
import { ValidatePromotionEligibilityService } from './application/validate-promotion-eligibility.service';
import { GrantPromotionBonusService } from './application/grant-promotion-bonus.service';
import { FindActivePromotionsService } from './application/find-active-promotions.service';
import { FindUserPromotionsService } from './application/find-user-promotions.service';
import { FindPromotionsAdminService } from './application/find-promotions-admin.service';
import { CreatePromotionService } from './application/create-promotion.service';
import { UpdatePromotionService } from './application/update-promotion.service';
import { FindPromotionParticipantsService } from './application/find-promotion-participants.service';
import { GetActivePromotionsForUserService } from './application/get-active-promotions-for-user.service';
import { GetMyPromotionsForUserService } from './application/get-my-promotions-for-user.service';
import { UpsertPromotionCurrencyService } from './application/upsert-promotion-currency.service';
import { UpsertPromotionTranslationService } from './application/upsert-promotion-translation.service';
import { PromotionRepository } from './infrastructure/promotion.repository';
import { PromotionMapper } from './infrastructure/promotion.mapper';
import { PROMOTION_REPOSITORY } from './ports';
import { PromotionUserController } from './controllers/user/promotion-user.controller';
import { PromotionAdminController } from './controllers/admin/promotion-admin.controller';
import { WageringModule } from '../wagering/wagering.module';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    WageringModule,
    WalletModule,
    NotificationModule,
    ConcurrencyModule,
  ],
  providers: [
    PromotionPolicy,
    ValidatePromotionEligibilityService,
    GrantPromotionBonusService,
    FindActivePromotionsService,
    FindUserPromotionsService,
    FindPromotionsAdminService,
    CreatePromotionService,
    UpdatePromotionService,
    FindPromotionParticipantsService,
    GetActivePromotionsForUserService,
    GetMyPromotionsForUserService,
    UpsertPromotionCurrencyService,
    UpsertPromotionTranslationService,
    PromotionMapper,
    {
      provide: PROMOTION_REPOSITORY,
      useClass: PromotionRepository,
    },
  ],
  controllers: [PromotionUserController, PromotionAdminController],
  exports: [
    GrantPromotionBonusService,
    ValidatePromotionEligibilityService,
    FindActivePromotionsService,
  ],
})
export class PromotionModule { }
