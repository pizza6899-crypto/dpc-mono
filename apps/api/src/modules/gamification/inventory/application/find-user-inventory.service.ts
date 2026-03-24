import { Injectable } from '@nestjs/common';
import { USER_INVENTORY_REPOSITORY_PORT } from '../ports/user-inventory.repository.port';
import type { UserInventoryRepositoryPort, UserInventoryDto } from '../ports/user-inventory.repository.port';
import { InventoryStatus } from '@prisma/client';
import { Inject } from '@nestjs/common';

export interface FindUserInventoryParams {
  userId: bigint;
  status?: InventoryStatus;
}

/**
 * 유저 본인의 인벤토리 목록을 조회하는 서비스
 */
@Injectable()
export class FindUserInventoryService {
  constructor(
    @Inject(USER_INVENTORY_REPOSITORY_PORT)
    private readonly inventoryRepo: UserInventoryRepositoryPort,
  ) { }

  async execute(params: FindUserInventoryParams): Promise<UserInventoryDto[]> {
    if (params.status) {
      return this.inventoryRepo.findByUserIdAndStatus(params.userId, params.status);
    }
    return this.inventoryRepo.findByUserId(params.userId);
  }
}
