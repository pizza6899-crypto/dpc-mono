import { Module, forwardRef } from '@nestjs/common';
import { USER_INVENTORY_REPOSITORY_PORT } from './ports/user-inventory.repository.port';
import { PrismaUserInventoryRepository } from './infrastructure/prisma-user-inventory.repository';
import { UserInventoryMapper } from './infrastructure/user-inventory.mapper';
import { GamificationCatalogModule } from '../catalog/catalog.module';
import { GamificationCharacterModule } from '../character/character.module';

// Application Services
import { GrantItemAdminService } from './application/grant-item-admin.service';
import { FindUserInventoryAdminService } from './application/find-user-inventory-admin.service';
import { RevokeInventoryItemAdminService } from './application/revoke-inventory-item-admin.service';

// Controllers
import { InventoryAdminController } from './controllers/admin/inventory-admin.controller';

@Module({
  imports: [
    GamificationCatalogModule,
    forwardRef(() => GamificationCharacterModule),
  ],
  controllers: [
    InventoryAdminController,
  ],
  providers: [
    UserInventoryMapper,
    // Services
    GrantItemAdminService,
    FindUserInventoryAdminService,
    RevokeInventoryItemAdminService,
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
