import { Module } from '@nestjs/common';
import { GAMIFICATION_CONFIG_REPOSITORY_PORT } from './ports/gamification-config.repository.port';
import { LEVEL_DEFINITION_REPOSITORY_PORT } from './ports/level-definition.repository.port';

import { PrismaGamificationConfigRepository } from './infrastructure/prisma-gamification-config.repository';
import { PrismaLevelDefinitionRepository } from './infrastructure/prisma-level-definition.repository';

import { GamificationConfigMapper } from './infrastructure/gamification-config.mapper';
import { LevelDefinitionMapper } from './infrastructure/level-definition.mapper';

import { GetGamificationConfigService } from './application/get-gamification-config.service';
import { UpdateGamificationConfigService } from './application/update-gamification-config.service';
import { GetLevelDefinitionListService } from './application/get-level-definition-list.service';
import { UpdateLevelDefinitionService } from './application/update-level-definition.service';

import { GamificationConfigAdminController } from './controllers/admin/gamification-config-admin.controller';
import { LevelDefinitionAdminController } from './controllers/admin/level-definition-admin.controller';
import { LevelDefinitionPublicController } from './controllers/public/level-definition-public.controller';

@Module({
  controllers: [
    GamificationConfigAdminController,
    LevelDefinitionAdminController,
    LevelDefinitionPublicController,
  ],
  providers: [
    // Repositories
    {
      provide: GAMIFICATION_CONFIG_REPOSITORY_PORT,
      useClass: PrismaGamificationConfigRepository,
    },
    {
      provide: LEVEL_DEFINITION_REPOSITORY_PORT,
      useClass: PrismaLevelDefinitionRepository,
    },
    // Mappers
    GamificationConfigMapper,
    LevelDefinitionMapper,
    // Services
    GetGamificationConfigService,
    UpdateGamificationConfigService,
    GetLevelDefinitionListService,
    UpdateLevelDefinitionService,
  ],
  exports: [
    GAMIFICATION_CONFIG_REPOSITORY_PORT,
    LEVEL_DEFINITION_REPOSITORY_PORT,
    GetGamificationConfigService,
    GetLevelDefinitionListService,
  ],
})
export class GamificationCatalogModule { }

