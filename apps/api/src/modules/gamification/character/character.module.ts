import { Module, forwardRef } from '@nestjs/common';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';
import { GamificationCatalogModule } from '../catalog/catalog.module';
import { WalletModule } from '../../wallet/wallet.module';

// Controllers
import { UserCharacterController } from './controllers/user/user-character.controller';
import { CharacterAdminController } from './controllers/admin/character-admin.controller';

// Services
import { FindUserCharacterService } from './application/find-user-character.service';
import { FindUserCharacterLogsService } from './application/find-user-character-logs.service';
import { AllocateStatPointsService } from './application/allocate-stat-points.service';
import { GainXpService } from './application/gain-xp.service';
import { SyncUserTotalStatsService } from './application/sync-user-total-stats.service';
import { ResetStatsAdminService } from './application/reset-stats-admin.service';
import { ResetStatsUserService } from './application/reset-stats-user.service';
import { WageringProgressionService } from './application/wagering-progression.service';

// Infrastructure
import { PrismaUserCharacterRepository } from './infrastructure/prisma-user-character.repository';
import { PrismaUserCharacterLogRepository } from './infrastructure/prisma-user-character-log.repository';
import { UserCharacterMapper } from './infrastructure/user-character.mapper';
import { UserCharacterLogMapper } from './infrastructure/user-character-log.mapper';

// Ports
import { USER_CHARACTER_REPOSITORY_PORT, USER_CHARACTER_LOG_REPOSITORY_PORT } from './ports';

@Module({
  imports: [
    ConcurrencyModule,
    SnowflakeModule,
    GamificationCatalogModule,
    WalletModule,
  ],
  controllers: [
    UserCharacterController,
    CharacterAdminController,
  ],
  providers: [
    // Services
    FindUserCharacterService,
    FindUserCharacterLogsService,
    AllocateStatPointsService,
    GainXpService,
    SyncUserTotalStatsService,
    ResetStatsAdminService,
    ResetStatsUserService,
    WageringProgressionService,

    // Mappers
    UserCharacterMapper,
    UserCharacterLogMapper,

    // Repositories (Port-to-Adapter mapping)
    {
      provide: USER_CHARACTER_REPOSITORY_PORT,
      useClass: PrismaUserCharacterRepository,
    },
    {
      provide: USER_CHARACTER_LOG_REPOSITORY_PORT,
      useClass: PrismaUserCharacterLogRepository,
    },
  ],
  exports: [
    // External modules might want to award XP
    GainXpService,
    FindUserCharacterService,
    SyncUserTotalStatsService,
    WageringProgressionService,
  ],
})
export class GamificationCharacterModule { }
