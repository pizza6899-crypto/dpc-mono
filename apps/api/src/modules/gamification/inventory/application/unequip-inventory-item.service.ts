import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { USER_INVENTORY_REPOSITORY_PORT } from '../ports/user-inventory.repository.port';
import type { UserInventoryRepositoryPort } from '../ports/user-inventory.repository.port';
import { SyncUserTotalStatsService } from '../../character/application/sync-user-total-stats.service';
import { InventoryItemNotFoundException, InventoryItemOwnershipException } from '../domain/inventory.exception';
import { InventoryStatus, InventoryAction } from '@prisma/client';
import { InventoryLoggerService } from './inventory-logger.service';

export interface UnequipInventoryItemParams {
  userId: bigint;
  inventoryId: bigint;
}

@Injectable()
export class UnequipInventoryItemService {
  constructor(
    @Inject(USER_INVENTORY_REPOSITORY_PORT)
    private readonly inventoryRepo: UserInventoryRepositoryPort,
    
    @Inject(forwardRef(() => SyncUserTotalStatsService))
    private readonly syncTotalStatsService: SyncUserTotalStatsService,

    private readonly advisoryLockService: AdvisoryLockService,
    private readonly loggerService: InventoryLoggerService,
  ) { }

  @Transactional()
  async execute(params: UnequipInventoryItemParams): Promise<void> {
    await this.advisoryLockService.acquireLock(
      LockNamespace.GAMIFICATION_CHARACTER,
      params.userId.toString(),
    );

    const targetItem = await this.inventoryRepo.findById(params.inventoryId);
    if (!targetItem) {
      throw new InventoryItemNotFoundException();
    }

    if (targetItem.userId !== params.userId) {
      throw new InventoryItemOwnershipException();
    }

    // 아이템이 이미 장착 해제된 상태면 작업을 수행할 필요가 없음
    if (targetItem.status !== InventoryStatus.ACTIVE) {
      return; 
    }

    targetItem.unequip();
    await this.inventoryRepo.save(targetItem);

    // 로그 기록
    await this.loggerService.log(targetItem, InventoryAction.UNEQUIP, {
      reason: 'User manual unequip',
    });

    // 스탯 동기화 수행
    await this.syncTotalStatsService.execute(params.userId);
  }
}
