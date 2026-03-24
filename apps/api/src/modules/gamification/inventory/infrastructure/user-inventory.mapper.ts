import { Injectable } from '@nestjs/common';
import { UserInventory as PrismaUserInventory, Prisma } from '@prisma/client';
import { UserInventory } from '../domain/user-inventory.entity';
import { Cast, PersistenceOf } from 'src/infrastructure/persistence/persistence.util';

@Injectable()
export class UserInventoryMapper {
  /**
   * Prisma -> Domain
   */
  toDomain(p: PersistenceOf<PrismaUserInventory>): UserInventory {
    return UserInventory.rehydrate({
      id: Cast.bigint(p.id),
      userId: Cast.bigint(p.userId),
      itemId: Cast.bigint(p.itemId),
      quantity: p.quantity,
      status: p.status,
      slot: p.slot,
      remainingUsageCount: p.remainingUsageCount,
      activatedAt: Cast.date(p.activatedAt),
      lastUsedAt: Cast.date(p.lastUsedAt),
      createdAt: Cast.date(p.createdAt),
      updatedAt: Cast.date(p.updatedAt),
    });
  }

  /**
   * Domain -> Prisma (Create/Update용 필드)
   */
  toPersistence(domain: UserInventory): Prisma.UserInventoryUncheckedCreateInput & Prisma.UserInventoryUncheckedUpdateInput {
    return {
      userId: domain.userId,
      itemId: domain.itemId,
      quantity: domain.quantity,
      status: domain.status,
      slot: domain.slot,
      remainingUsageCount: domain.remainingUsageCount,
      activatedAt: domain.activatedAt,
      lastUsedAt: domain.lastUsedAt,
      // ID는 Prisma의 autoincrement를 따르도록 생략 (Update 시에는 where 절에서 사용)
    };
  }
}
