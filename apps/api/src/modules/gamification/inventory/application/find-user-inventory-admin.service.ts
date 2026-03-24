import { Inject, Injectable } from '@nestjs/common';
import { InventoryStatus, ItemType } from '@prisma/client';
import { USER_INVENTORY_REPOSITORY_PORT } from '../ports/user-inventory.repository.port';
import type { UserInventoryRepositoryPort, UserInventoryDto } from '../ports/user-inventory.repository.port';


export interface FindUserInventoryAdminParams {
  userId: bigint;
  status?: InventoryStatus;
  itemType?: ItemType;
}

/**
 * 관리자가 특정 유저의 인벤토리 현황을 조회하는 서비스
 */
@Injectable()
export class FindUserInventoryAdminService {
  constructor(
    @Inject(USER_INVENTORY_REPOSITORY_PORT)
    private readonly inventoryRepo: UserInventoryRepositoryPort,
  ) { }

  /**
   * 유저별 인벤토리 목록 조회
   */
  async execute(params: FindUserInventoryAdminParams): Promise<UserInventoryDto[]> {
    // 모든 상태/타입 정보를 통합하여 필터링된 인벤토리를 조회하여 반환
    return this.inventoryRepo.findByUserId(params.userId, {
      status: params.status,
      itemType: params.itemType,
    });
  }



  /**
   * 단일 인벤토리 아이템 조회
   */
  async findById(id: bigint): Promise<UserInventoryDto | null> {
    return this.inventoryRepo.findDtoById(id);
  }
}

