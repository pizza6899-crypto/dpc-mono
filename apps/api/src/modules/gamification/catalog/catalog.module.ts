import { Module } from '@nestjs/common';
import { SqidsModule } from 'src/common/sqids/sqids.module';

import { GAMIFICATION_CONFIG_REPOSITORY_PORT } from './ports/gamification-config.repository.port';
import { LEVEL_DEFINITION_REPOSITORY_PORT } from './ports/level-definition.repository.port';
import { ITEM_CATALOG_REPOSITORY_PORT } from './ports/item-catalog.repository.port';

import { PrismaGamificationConfigRepository } from './infrastructure/prisma-gamification-config.repository';
import { PrismaLevelDefinitionRepository } from './infrastructure/prisma-level-definition.repository';
import { PrismaItemCatalogRepository } from './infrastructure/prisma-item-catalog.repository';

import { GamificationConfigMapper } from './infrastructure/gamification-config.mapper';
import { LevelDefinitionMapper } from './infrastructure/level-definition.mapper';
import { ItemCatalogMapper } from './infrastructure/item-catalog.mapper';

import { GetGamificationConfigService } from './application/get-gamification-config.service';
import { UpdateGamificationConfigService } from './application/update-gamification-config.service';
import { GetLevelDefinitionListService } from './application/get-level-definition-list.service';
import { UpdateLevelDefinitionService } from './application/update-level-definition.service';
import { GetItemCatalogListService } from './application/get-item-catalog-list.service';
import { GetItemCatalogDetailService } from './application/get-item-catalog-detail.service';
import { UpdateItemCatalogService } from './application/update-item-catalog.service';


import { GamificationConfigAdminController } from './controllers/admin/gamification-config-admin.controller';
import { LevelDefinitionAdminController } from './controllers/admin/level-definition-admin.controller';
import { LevelDefinitionPublicController } from './controllers/public/level-definition-public.controller';
import { ItemCatalogPublicController } from './controllers/public/item-catalog-public.controller';
import { ItemCatalogAdminController } from './controllers/admin/item-catalog-admin.controller';


@Module({
  imports: [SqidsModule],

  controllers: [
    GamificationConfigAdminController,
    LevelDefinitionAdminController,
    LevelDefinitionPublicController,
    ItemCatalogPublicController,
    ItemCatalogAdminController,
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
    {
      provide: ITEM_CATALOG_REPOSITORY_PORT,
      useClass: PrismaItemCatalogRepository,
    },
    // Mappers
    GamificationConfigMapper,
    LevelDefinitionMapper,
    ItemCatalogMapper,
    // Services
    GetGamificationConfigService,
    UpdateGamificationConfigService,
    GetLevelDefinitionListService,
    UpdateLevelDefinitionService,
    GetItemCatalogListService,
    GetItemCatalogDetailService,
    UpdateItemCatalogService,

  ],
  exports: [
    GAMIFICATION_CONFIG_REPOSITORY_PORT,
    LEVEL_DEFINITION_REPOSITORY_PORT,
    ITEM_CATALOG_REPOSITORY_PORT,
    GetGamificationConfigService,
    GetLevelDefinitionListService,
    GetItemCatalogListService,
    GetItemCatalogDetailService,
    UpdateItemCatalogService,

  ],
})
export class GamificationCatalogModule { }
