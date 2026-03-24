import { Injectable } from '@nestjs/common';
import { ItemSlot, InventoryStatus } from '@prisma/client';
import { UserInventory } from './user-inventory.entity';
import { UserInventoryDto } from '../ports/user-inventory.repository.port';
import {
  InventoryItemInvalidStateException,
  InventoryItemAlreadyEquippedException,
  InventoryItemExpiredException,
  InventoryItemConsumedException
} from './inventory.exception';

/**
 * [Gamification] 인벤토리 장착 정책 (Domain Policy)
 * 
 * 아이템 장착 시의 비즈니스 규칙과 제약 사항을 관리합니다.
 */
@Injectable()
export class InventoryEquipPolicy {
  /**
   * 장착 대상 아이템이 장착 가능한 상태인지 검증합니다.
   */
  validate(targetItem: UserInventory): void {
    if (targetItem.status === InventoryStatus.EXPIRED) {
      throw new InventoryItemExpiredException();
    }
    if (targetItem.status === InventoryStatus.CONSUMED) {
      throw new InventoryItemConsumedException();
    }

    // 일반적인 사용 불가능 상태 체크
    if (!targetItem.canBeUsed()) {
      throw new InventoryItemInvalidStateException('Item cannot be used');
    }
  }

  /**
   * 장착하려 할 때, 충돌이 발생하는(해제되어야 하는) 기존 아이템 목록을 식별합니다.
   * 
   * 1. 지정된 슬롯에 이미 장착된 타 아이템
   * 2. 동일한 종류(itemId)이면서 다른 슬롯에 장착된 아이템 (중복 방지)
   * 
   * @param targetItem 장착하려는 대상 아이템 (도메인 엔티티)
   * @param targetSlot 장착하려는 슬롯
   * @param activeItems 현재 활성화(장착)된 유저의 모든 아이템 목록 (DTO)
   */
  findConflictingItems(
    targetItem: UserInventory,
    targetSlot: ItemSlot,
    activeItems: UserInventoryDto[],
  ): bigint[] {
    const conflictingIds: bigint[] = [];

    for (const active of activeItems) {
      // 자기 자신은 충돌에서 제외 (이미 그 슬롯에 있을 수 있음)
      if (active.id === targetItem.id) continue;

      // 1. 같은 슬롯에 이미 아이템이 있는 경우
      if (active.slot === targetSlot) {
        conflictingIds.push(active.id);
        continue; // 중복 추가 방지
      }

      // 2. [Unique Rule] 동일한 아이템 종류(itemId)가 이미 다른 기물에 있는 경우
      if (active.itemId === targetItem.itemId) {
        conflictingIds.push(active.id);
      }
    }

    return conflictingIds;
  }
}
