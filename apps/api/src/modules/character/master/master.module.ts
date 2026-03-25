import { Module } from '@nestjs/common';
import { CHARACTER_CONFIG_REPOSITORY_PORT } from './ports/character-config.repository.port';
import { LEVEL_DEFINITION_REPOSITORY_PORT } from './ports/level-definition.repository.port';

import { PrismaCharacterConfigRepository } from './infrastructure/prisma-character-config.repository';
import { PrismaLevelDefinitionRepository } from './infrastructure/prisma-level-definition.repository';

import { CharacterConfigMapper } from './infrastructure/character-config.mapper';
import { LevelDefinitionMapper } from './infrastructure/level-definition.mapper';

import { GetCharacterConfigService } from './application/get-character-config.service';
import { UpdateCharacterConfigService } from './application/update-character-config.service';
import { GetLevelDefinitionListService } from './application/get-level-definition-list.service';
import { UpdateLevelDefinitionService } from './application/update-level-definition.service';

import { CharacterConfigAdminController } from './controllers/admin/character-config-admin.controller';
import { LevelDefinitionAdminController } from './controllers/admin/level-definition-admin.controller';
import { LevelDefinitionPublicController } from './controllers/public/level-definition-public.controller';

@Module({
  controllers: [
    CharacterConfigAdminController,
    LevelDefinitionAdminController,
    LevelDefinitionPublicController,
  ],
  providers: [
    // Repositories
    {
      provide: CHARACTER_CONFIG_REPOSITORY_PORT,
      useClass: PrismaCharacterConfigRepository,
    },
    {
      provide: LEVEL_DEFINITION_REPOSITORY_PORT,
      useClass: PrismaLevelDefinitionRepository,
    },
    // Mappers
    CharacterConfigMapper,
    LevelDefinitionMapper,
    // Services
    GetCharacterConfigService,
    UpdateCharacterConfigService,
    GetLevelDefinitionListService,
    UpdateLevelDefinitionService,
  ],
  exports: [
    CHARACTER_CONFIG_REPOSITORY_PORT,
    LEVEL_DEFINITION_REPOSITORY_PORT,
    GetCharacterConfigService,
    GetLevelDefinitionListService,
  ],
})
export class CharacterMasterModule { }

