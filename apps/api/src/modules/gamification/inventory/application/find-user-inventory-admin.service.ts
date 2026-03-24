import { Inject, Injectable } from '@nestjs/common';
import { USER_INVENTORY_REPOSITORY_PORT } from '../ports/user-inventory.repository.port';
import type { UserInventoryRepositoryPort, UserInventoryDto } from '../ports/user-inventory.repository.port';
import { InventoryStatus } from '@prisma/client';

export interface FindUserInventoryAdminParams {
  userId: bigint;
  status?: InventoryStatus;
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
    if (params.status) {
      return this.inventoryRepo.findByUserIdAndStatus(params.userId, params.status);
    }

    // 상태 필터가 없으면 해당 유저의 모든 인벤토리(전체 상태)를 조회하여 반환
    return this.inventoryRepo.findByUserId(params.userId);
  }


  /**
   * 단일 인벤토리 아이템 조회
   */
  async findById(id: bigint): Promise<UserInventoryDto | null> {
    return this.inventoryRepo.findDtoById(id);
  }
}

