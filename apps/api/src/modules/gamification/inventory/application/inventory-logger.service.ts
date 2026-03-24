import { Inject, Injectable } from '@nestjs/common';
import { InventoryAction } from '@prisma/client';
import { UserInventoryLog } from '../domain/user-inventory-log.entity';
import { USER_INVENTORY_LOG_REPOSITORY_PORT } from '../ports/user-inventory-log.repository.port';
import type { UserInventoryLogRepositoryPort } from '../ports/user-inventory-log.repository.port';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import { UserInventory } from '../domain/user-inventory.entity';
import type { AnyInventoryLogMetadata } from '../domain/user-inventory-log-metadata';

/**
 * 인벤토리 활동 로그 기록을 위한 추가 옵션
 */
export interface LogOptions {
  previousUsageCount?: number | null;
  previousQuantity?: number | null; // 수량 변화 추적용 추가
  actorId?: string | null;
  reason?: string | null;
  metadata?: AnyInventoryLogMetadata;
}

/**
 * [Gamification] 인벤토리 활동 로그 기록 통합 서비스
 */
@Injectable()
export class InventoryLoggerService {
  constructor(
    @Inject(USER_INVENTORY_LOG_REPOSITORY_PORT)
    private readonly logRepo: UserInventoryLogRepositoryPort,
    private readonly snowflakeService: SnowflakeService,
  ) { }

  /**
   * 아이템의 상태 변화를 기록 (Snowflake ID 발급 포함)
   */
  async log(inventory: UserInventory, action: InventoryAction, options: LogOptions = {}): Promise<void> {
    // Snowflake ID 및 정확한 생성 시각 획득 (파티셔닝 정합성 확보)
    const { id, timestamp } = this.snowflakeService.generate();

    // 수량 및 사용 횟수 변화를 metadata에 보정하여 기록 (기존 스키마 유지 범위 내 상세 로깅)
    const metadata: AnyInventoryLogMetadata = {
      ...options.metadata,
      prev_qty: options.previousQuantity ?? null,
      curr_qty: inventory.quantity,
    };

    const log = UserInventoryLog.create({
      id,
      createdAt: timestamp,
      inventoryId: inventory.id,
      userId: inventory.userId,
      itemId: inventory.itemId,
      action: action,
      slot: inventory.slot,
      previousUsageCount: options.previousUsageCount ?? null,
      currentUsageCount: inventory.remainingUsageCount,
      actorId: options.actorId,
      reason: options.reason,
      metadata: metadata,
    });

    await this.logRepo.create(log);
  }
}

