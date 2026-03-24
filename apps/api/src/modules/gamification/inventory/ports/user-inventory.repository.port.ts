import { InventoryStatus, ItemSlot } from '@prisma/client';
import { UserInventory } from '../domain/user-inventory.entity';
import { ItemEffect } from '../../catalog/domain/item-catalog.entity';

export interface UserInventoryDto {
  id: bigint;
  userId: bigint;
  itemId: bigint;
  quantity: number;
  status: InventoryStatus;
  slot: string | null;
  effects: ItemEffect[]; // ItemCatalog's effects Json
}


export interface UserInventoryRepositoryPort {
  /**
   * 아이템 ID로 단일 조회
   */
  findById(id: bigint): Promise<UserInventory | null>;

  /**
   * 유저의 모든 인벤토리 조회 (카탈로그 포함 응답 DTO 반환)
   */
  findByUserId(userId: bigint): Promise<UserInventoryDto[]>;

  /**
   * 유저의 특정 상태의 아이템 목록 조회 (카탈로그 정보 포함)
   */
  findByUserIdAndStatus(userId: bigint, status: InventoryStatus): Promise<UserInventoryDto[]>;

  /**
   * 유저의 특정 슬롯에 장착된 아이템 단일 조회 (엔티티 반환)
   */
  findByUserIdAndSlot(userId: bigint, slot: ItemSlot): Promise<UserInventory | null>;

  /**
   * 유저의 모든 활성 보너스 효과 조회
   * (장착 중이거나 영구 활성 상태인 아이템들의 효과 목록)
   */
  findActiveBonuses(userId: bigint): Promise<UserInventoryDto[]>;

  /**
   * 인벤토리 상태 저장 (생성/수정)
   */
  save(inventory: UserInventory): Promise<UserInventory>;
}

export const USER_INVENTORY_REPOSITORY_PORT = Symbol('USER_INVENTORY_REPOSITORY_PORT');
