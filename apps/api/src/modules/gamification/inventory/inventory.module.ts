import { Module, forwardRef } from '@nestjs/common';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';
import { USER_INVENTORY_REPOSITORY_PORT } from './ports/user-inventory.repository.port';
import { PrismaUserInventoryRepository } from './infrastructure/prisma-user-inventory.repository';
import { UserInventoryMapper } from './infrastructure/user-inventory.mapper';
import { GamificationCatalogModule } from '../catalog/catalog.module';
import { GamificationCharacterModule } from '../character/character.module';

// Application Services
import { GrantItemAdminService } from './application/grant-item-admin.service';
import { FindUserInventoryAdminService } from './application/find-user-inventory-admin.service';
import { FindInventoryLogsAdminService } from './application/find-inventory-logs-admin.service';
import { RevokeInventoryItemAdminService } from './application/revoke-inventory-item-admin.service';
import { FindUserInventoryService } from './application/find-user-inventory.service';
import { EquipInventoryItemService } from './application/equip-inventory-item.service';
import { UnequipInventoryItemService } from './application/unequip-inventory-item.service';
import { InventoryLoggerService } from './application/inventory-logger.service';
import { InventoryEquipPolicy } from './domain/inventory-equip.policy';

// Repositories
import { USER_INVENTORY_LOG_REPOSITORY_PORT } from './ports/user-inventory-log.repository.port';
import { PrismaUserInventoryLogRepository } from './infrastructure/prisma-user-inventory-log.repository';


// Controllers
import { InventoryAdminController } from './controllers/admin/inventory-admin.controller';
import { InventoryUserController } from './controllers/user/inventory-user.controller';

import { SqidsModule } from 'src/common/sqids/sqids.module';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';

@Module({
  imports: [
    ConcurrencyModule,
    SqidsModule,
    SnowflakeModule,
    GamificationCatalogModule,

    forwardRef(() => GamificationCharacterModule),
  ],
  controllers: [
    InventoryAdminController,
    InventoryUserController,
  ],
  providers: [
    UserInventoryMapper,
    // Services
    FindUserInventoryService,
    FindUserInventoryAdminService,
    FindInventoryLogsAdminService,
    GrantItemAdminService,
    InventoryEquipPolicy,
    InventoryLoggerService,
    RevokeInventoryItemAdminService,
    UnequipInventoryItemService,
    EquipInventoryItemService, // This was present in the original, but not in the user's provided list for providers. Re-adding it to maintain functionality.
    {
      provide: USER_INVENTORY_REPOSITORY_PORT,
      useClass: PrismaUserInventoryRepository,
    },
    {
      provide: USER_INVENTORY_LOG_REPOSITORY_PORT,
      useClass: PrismaUserInventoryLogRepository,
    },
  ],
  exports: [
    USER_INVENTORY_REPOSITORY_PORT,
    USER_INVENTORY_LOG_REPOSITORY_PORT,
    UserInventoryMapper,
    GrantItemAdminService,
    InventoryLoggerService,
  ],
})
export class GamificationInventoryModule { }
