import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { InventoryAction, InventoryStatus } from '@prisma/client';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { ITEM_CATALOG_REPOSITORY_PORT } from '../../catalog/ports/item-catalog.repository.port';
import type { ItemCatalogRepositoryPort } from '../../catalog/ports/item-catalog.repository.port';
import { USER_INVENTORY_REPOSITORY_PORT } from '../ports/user-inventory.repository.port';
import type { UserInventoryRepositoryPort } from '../ports/user-inventory.repository.port';
import { UserInventory } from '../domain/user-inventory.entity';
import { ItemNotFoundException } from '../../catalog/domain/catalog.exception';
import { InventoryLoggerService } from './inventory-logger.service';

export interface GrantItemAdminParams {
  userId: bigint;
  itemId: bigint;
  quantity?: number;
}

/**
 * 관리자가 특정 유저에게 수동으로 아이템을 지급하는 서비스
 */
@Injectable()
export class GrantItemAdminService {
  constructor(
    @Inject(ITEM_CATALOG_REPOSITORY_PORT)
    private readonly itemCatalogRepo: ItemCatalogRepositoryPort,

    @Inject(USER_INVENTORY_REPOSITORY_PORT)
    private readonly inventoryRepo: UserInventoryRepositoryPort,

    private readonly advisoryLockService: AdvisoryLockService,
    private readonly loggerService: InventoryLoggerService,
  ) { }

  /**
   * 아이템 지급 수행
   */
  @Transactional()
  async execute(params: GrantItemAdminParams): Promise<UserInventory> {
    // 1. 유저별 게이미피케이션 액션 권고락 획득 (지급 시 중복 방지 등)
    await this.advisoryLockService.acquireLock(
      LockNamespace.GAMIFICATION_CHARACTER,
      params.userId.toString(),
    );

    // 2. 유효한 아이템인지 카탈로그에서 확인
    const item = await this.itemCatalogRepo.findById(params.itemId);
    if (!item) {
      throw new ItemNotFoundException();
    }

    // 3. 인벤토리 엔티티 생성
    const inventory = UserInventory.rehydrate({
      id: 0n,
      userId: params.userId,
      itemId: params.itemId,
      quantity: params.quantity ?? 1,
      status: InventoryStatus.PENDING,
      slot: null,
      remainingUsageCount: item.maxUsageCount,
      activatedAt: null,
      lastUsedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 4. 영속화
    const savedInventory = await this.inventoryRepo.save(inventory);

    // 5. 로깅 기록 (트랜잭션에 포함)
    await this.loggerService.log(savedInventory, InventoryAction.GRANT, {
      actorId: 'ADMIN', // 혹은 실제 어드민 ID 주입 필요
      reason: 'Admin hand granted',
      metadata: {
        adminId: 'ADMIN', // 실제 context에서 가져오는 로직 추가 권장
      },
    });

    return savedInventory;
  }
}

