import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ITEM_CATALOG_REPOSITORY_PORT } from '../../catalog/ports/item-catalog.repository.port';
import type { ItemCatalogRepositoryPort } from '../../catalog/ports/item-catalog.repository.port';
import { USER_INVENTORY_REPOSITORY_PORT } from '../ports/user-inventory.repository.port';
import type { UserInventoryRepositoryPort } from '../ports/user-inventory.repository.port';
import { UserInventory } from '../domain/user-inventory.entity';
import { ItemNotFoundException } from '../../catalog/domain/catalog.exception';

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
  ) { }

  /**
   * 아이템 지급 수행
   */
  @Transactional()
  async execute(params: GrantItemAdminParams): Promise<UserInventory> {
    // 1. 유효한 아이템인지 카탈로그에서 확인
    const item = await this.itemCatalogRepo.findById(params.itemId);
    if (!item) {
      throw new ItemNotFoundException(params.itemId);
    }

    // 2. 인벤토리 엔티티 생성
    // (현재는 Snowflake 대신 DB autoincrement 전략을 따르기로 했으므로 id는 0n으로 처리됨)
    const inventory = UserInventory.create({
      userId: params.userId,
      itemId: params.itemId,
      quantity: params.quantity ?? 1,
    });

    // 3. 영속화
    return this.inventoryRepo.save(inventory);
  }
}
