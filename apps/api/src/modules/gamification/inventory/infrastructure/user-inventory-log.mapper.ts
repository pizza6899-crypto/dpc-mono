import { Prisma } from '@prisma/client';
import { UserInventoryLog } from '../domain/user-inventory-log.entity';
import { Cast, PersistenceOf } from 'src/infrastructure/persistence/persistence.util';

/**
 * 인벤토리 로그 엔티티 매퍼
 */
export class UserInventoryLogMapper {
  /**
   * DB 레코드에서 도메인 엔티티로 변환
   */
  static toDomain(record: PersistenceOf<Prisma.UserInventoryLogGetPayload<{}>>): UserInventoryLog {
    return UserInventoryLog.rehydrate({
      id: Cast.bigint(record.id),
      createdAt: Cast.date(record.createdAt),
      inventoryId: Cast.bigint(record.inventoryId),
      userId: Cast.bigint(record.userId),
      itemId: Cast.bigint(record.itemId),
      action: record.action,
      slot: record.slot,
      previousUsageCount: record.previousUsageCount,
      currentUsageCount: record.currentUsageCount,
      actorId: record.actorId,
      reason: record.reason,
      metadata: record.metadata,
    });
  }

  /**
   * 도메인 엔티티에서 DB 레코드로 변환 (Insert 전용)
   */
  static toPersistence(domain: UserInventoryLog) {
    return {
      id: domain.id,
      createdAt: domain.createdAt,
      inventoryId: domain.inventoryId,
      userId: domain.userId,
      itemId: domain.itemId,
      action: domain.action,
      slot: domain.slot,
      previousUsageCount: domain.previousUsageCount,
      currentUsageCount: domain.currentUsageCount,
      actorId: domain.actorId,
      reason: domain.reason,
      metadata: domain.metadata as any,
    };
  }
}
