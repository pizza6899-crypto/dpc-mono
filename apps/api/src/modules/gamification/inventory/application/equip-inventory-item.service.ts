import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { USER_INVENTORY_REPOSITORY_PORT } from '../ports/user-inventory.repository.port';
import type { UserInventoryRepositoryPort } from '../ports/user-inventory.repository.port';
import { SyncUserTotalStatsService } from '../../character/application/sync-user-total-stats.service';
import { InventoryItemNotFoundException, InventoryItemOwnershipException } from '../domain/inventory.exception';
import { ItemSlot, InventoryStatus, InventoryAction } from '@prisma/client';
import { InventoryLoggerService } from './inventory-logger.service';
import { InventoryEquipPolicy } from '../domain/inventory-equip.policy';

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
    private readonly equipPolicy: InventoryEquipPolicy,
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

    let needsSync = false;

    // 이미 해당 슬롯에 장착되어 있다면 작업 불필요
    if (targetItem.status === InventoryStatus.ACTIVE && targetItem.slot === params.slot) {
      return;
    }

    // 장착 정합성 및 충돌 검사 (Policy 위임)
    this.equipPolicy.validate(targetItem);

    const activeItems = await this.inventoryRepo.findActiveBonuses(params.userId);
    const conflictingIds = this.equipPolicy.findConflictingItems(targetItem, params.slot, activeItems);

    // 식별된 충돌 아이템들을 모두 순차적으로 해제 처리
    for (const conflictId of conflictingIds) {
      const conflictItem = await this.inventoryRepo.findById(conflictId);
      if (conflictItem) {
        conflictItem.unequip();
        await this.inventoryRepo.save(conflictItem);
        await this.loggerService.log(conflictItem, InventoryAction.UNEQUIP, {
          reason: `Auto unequipped to resolve conflict for item ${targetItem.id} in slot ${params.slot}`,
        });
        needsSync = true;
      }
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
