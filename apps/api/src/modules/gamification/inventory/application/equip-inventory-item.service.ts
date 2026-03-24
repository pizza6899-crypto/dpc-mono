import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { USER_INVENTORY_REPOSITORY_PORT } from '../ports/user-inventory.repository.port';
import type { UserInventoryRepositoryPort } from '../ports/user-inventory.repository.port';
import { SyncUserTotalStatsService } from '../../character/application/sync-user-total-stats.service';
import { InventoryItemNotFoundException, InventoryItemOwnershipException } from '../domain/inventory.exception';
import { ItemSlot, InventoryAction } from '@prisma/client';
import { InventoryLoggerService } from './inventory-logger.service';

export interface EquipInventoryItemParams {
  userId: bigint;
  inventoryId: bigint;
  slot: ItemSlot;
}

@Injectable()
export class EquipInventoryItemService {
  constructor(
    @Inject(USER_INVENTORY_REPOSITORY_PORT)
    private readonly inventoryRepo: UserInventoryRepositoryPort,

    @Inject(forwardRef(() => SyncUserTotalStatsService))
    private readonly syncTotalStatsService: SyncUserTotalStatsService,

    private readonly advisoryLockService: AdvisoryLockService,
    private readonly loggerService: InventoryLoggerService,
  ) { }

  @Transactional()
  async execute(params: EquipInventoryItemParams): Promise<void> {
    // 1. 유저 락 획득 (장착/유물 충돌 방지)
    await this.advisoryLockService.acquireLock(
      LockNamespace.GAMIFICATION_CHARACTER,
      params.userId.toString(),
    );

    // 2. 장착할 아이템 조회
    const targetItem = await this.inventoryRepo.findById(params.inventoryId);
    if (!targetItem) {
      throw new InventoryItemNotFoundException();
    }

    if (targetItem.userId !== params.userId) {
      throw new InventoryItemOwnershipException();
    }

    // 3. 같은 슬롯에 이미 장착된 아이템이 있는지 확인
    const existingEquippedItem = await this.inventoryRepo.findByUserIdAndSlot(
      params.userId,
      params.slot
    );

    let needsSync = false;

    // 만약 이미 장착된 아이템이 자신(`targetItem`)이라면 조기 반환.
    if (existingEquippedItem && existingEquippedItem.id === targetItem.id) {
      return;
    }

    // 이미 다른 아이템이 같은 슬롯에 있다면 장착 해제 처리
    if (existingEquippedItem) {
      existingEquippedItem.unequip();
      await this.inventoryRepo.save(existingEquippedItem);

      // 로그 기록: 해제
      await this.loggerService.log(existingEquippedItem, InventoryAction.UNEQUIP, {
        reason: `Replaced by item ${targetItem.id}`,
      });

      needsSync = true;
    }

    // 4. 대상 아이템 장착 처리
    // 현재 targetItem이 다른 슬롯에 장착되어 있는 경우 equip() 내에서 slot을 덮어씀.
    targetItem.equip(params.slot);
    await this.inventoryRepo.save(targetItem);

    // 로그 기록: 장착
    await this.loggerService.log(targetItem, InventoryAction.EQUIP, {
      reason: `Equipped to slot ${params.slot}`,
    });

    needsSync = true;

    // 5. 스탯 리스펙 처리 (장착/해제가 일어났으므로 동기화)
    if (needsSync) {
      await this.syncTotalStatsService.execute(params.userId);
    }
  }
}
