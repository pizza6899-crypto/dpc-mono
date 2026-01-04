import { Module } from '@nestjs/common';
import {
  TierMapper,
  UserTierMapper,
  TierHistoryMapper,
  TierRepository,
  UserTierRepository,
  TierHistoryRepository
} from './infrastructure';
import {
  TIER_REPOSITORY,
  USER_TIER_REPOSITORY,
  TIER_HISTORY_REPOSITORY
} from './ports/repository.token';
import { CreateTierService } from './application/create-tier.service';
import { UpdateTierService } from './application/update-tier.service';
import { FindTiersService } from './application/find-tiers.service';
import { GetUserTierService } from './application/get-user-tier.service';
import { TierAdminController } from './controllers/admin/tier-admin.controller';
import { TierUserController } from './controllers/user/tier-user.controller';
import { UpdateTierTranslationService } from './application/translation/update-tier-translation.service';
import { AssignDefaultTierService } from './application/assign-default-tier.service';

@Module({
  imports: [],
  providers: [
    TierMapper,
    UserTierMapper,
    TierHistoryMapper,
    CreateTierService,
    UpdateTierService,
    FindTiersService,
    GetUserTierService,
    UpdateTierTranslationService,
    AssignDefaultTierService,
    {
      provide: TIER_REPOSITORY,
      useClass: TierRepository,
    },
    {
      provide: USER_TIER_REPOSITORY,
      useClass: UserTierRepository,
    },
    {
      provide: TIER_HISTORY_REPOSITORY,
      useClass: TierHistoryRepository,
    },
  ],
  controllers: [
    TierAdminController,
    TierUserController,
  ],
  exports: [
    TIER_REPOSITORY,
    USER_TIER_REPOSITORY,
    TIER_HISTORY_REPOSITORY,
    // Services
    CreateTierService,
    UpdateTierService,
    FindTiersService,
    GetUserTierService,
    AssignDefaultTierService,
  ],
})

export class TierModule { }
