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

@Module({
  imports: [],
  providers: [
    TierMapper,
    UserTierMapper,
    TierHistoryMapper,
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
  controllers: [],
  exports: [
    TIER_REPOSITORY,
    USER_TIER_REPOSITORY,
    TIER_HISTORY_REPOSITORY,
  ],
})
export class TierModule { }
