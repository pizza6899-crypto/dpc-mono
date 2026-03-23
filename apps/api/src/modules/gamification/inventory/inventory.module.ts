import { Module } from '@nestjs/common';
import { USER_INVENTORY_REPOSITORY_PORT } from './ports/user-inventory.repository.port';
import { PrismaUserInventoryRepository } from './infrastructure/prisma-user-inventory.repository';
import { UserInventoryMapper } from './infrastructure/user-inventory.mapper';

@Module({
  providers: [
    UserInventoryMapper,
    {
      provide: USER_INVENTORY_REPOSITORY_PORT,
      useClass: PrismaUserInventoryRepository,
    },
  ],
  exports: [
    USER_INVENTORY_REPOSITORY_PORT,
    UserInventoryMapper,
  ],
})
export class GamificationInventoryModule { }
