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
import { RevokeInventoryItemAdminService } from './application/revoke-inventory-item-admin.service';
import { FindUserInventoryService } from './application/find-user-inventory.service';
import { EquipInventoryItemService } from './application/equip-inventory-item.service';
import { UnequipInventoryItemService } from './application/unequip-inventory-item.service';

// Controllers
import { InventoryAdminController } from './controllers/admin/inventory-admin.controller';
import { InventoryUserController } from './controllers/user/inventory-user.controller';

import { SqidsModule } from 'src/common/sqids/sqids.module';

@Module({
  imports: [
    ConcurrencyModule,
    SqidsModule,
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
    GrantItemAdminService,
    FindUserInventoryAdminService,
    RevokeInventoryItemAdminService,
    FindUserInventoryService,
    EquipInventoryItemService,
    UnequipInventoryItemService,
    {
      provide: USER_INVENTORY_REPOSITORY_PORT,
      useClass: PrismaUserInventoryRepository,
    },
  ],
  exports: [
    USER_INVENTORY_REPOSITORY_PORT,
    UserInventoryMapper,
    GrantItemAdminService,
  ],
})
export class GamificationInventoryModule { }
