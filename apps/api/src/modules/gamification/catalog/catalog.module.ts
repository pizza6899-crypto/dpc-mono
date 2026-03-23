import { Module } from '@nestjs/common';
import { GAMIFICATION_CONFIG_REPOSITORY_PORT } from './ports/gamification-config.repository.port';
import { PrismaGamificationConfigRepository } from './infrastructure/prisma-gamification-config.repository';
import { GamificationConfigMapper } from './infrastructure/gamification-config.mapper';
import { GetGamificationConfigService } from './application/get-gamification-config.service';
import { UpdateGamificationConfigService } from './application/update-gamification-config.service';
import { GamificationConfigAdminController } from './controllers/admin/gamification-config-admin.controller';

@Module({
  controllers: [GamificationConfigAdminController],
  providers: [
    // Repositories
    {
      provide: GAMIFICATION_CONFIG_REPOSITORY_PORT,
      useClass: PrismaGamificationConfigRepository,
    },
    // Mappers
    GamificationConfigMapper,
    // Services
    GetGamificationConfigService,
    UpdateGamificationConfigService,
  ],
  exports: [
    GAMIFICATION_CONFIG_REPOSITORY_PORT,
    GetGamificationConfigService,
  ],
})
export class GamificationCatalogModule { }
