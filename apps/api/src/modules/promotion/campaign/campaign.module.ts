// src/modules/promotion/campaign/campaign/campaign.module.ts
import { Module } from '@nestjs/common';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';
import { PromotionPolicy } from './domain';
import { ValidatePromotionEligibilityService } from './application/validate-promotion-eligibility.service';
import { GrantPromotionBonusService } from './application/grant-promotion-bonus.service';
import { FindPromotionsAdminService } from './application/find-promotions-admin.service';
import { CreatePromotionService } from './application/create-promotion.service';
import { UpdatePromotionService } from './application/update-promotion.service';
import { FindPromotionParticipantsService } from './application/find-promotion-participants.service';
import { GetActivePromotionsForUserService } from './application/get-active-promotions-for-user.service';
import { UpsertPromotionCurrencyService } from './application/upsert-promotion-currency.service';
import { UpsertPromotionTranslationService } from './application/upsert-promotion-translation.service';
import { ProcessDepositPromotionService } from './application/process-deposit-promotion.service';
import { PromotionRepository } from './infrastructure/promotion.repository';
import { PromotionMapper } from './infrastructure/promotion.mapper';
import { PROMOTION_REPOSITORY } from './ports';
import { PromotionUserController } from './controllers/user/promotion-user.controller';
import { PromotionAdminController } from './controllers/admin/promotion-admin.controller';
import { NotificationModule } from '../../notification/notification.module';
import { RewardModule } from '../../reward/reward.module';
import { PromotionConfigModule } from '../config/promotion-config.module';

@Module({
  imports: [
    NotificationModule,
    ConcurrencyModule,
    RewardModule,
    PromotionConfigModule,
  ],
  providers: [
    PromotionPolicy,
    ValidatePromotionEligibilityService,
    GrantPromotionBonusService,
    FindPromotionsAdminService,
    CreatePromotionService,
    UpdatePromotionService,
    FindPromotionParticipantsService,
    GetActivePromotionsForUserService,
    UpsertPromotionCurrencyService,
    UpsertPromotionTranslationService,
    ProcessDepositPromotionService,
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
    ProcessDepositPromotionService,
  ],
})
export class PromotionCampaignModule { }
