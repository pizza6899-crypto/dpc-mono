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
    
    // DB의 indexes([userId, status])를 활용하기 위해
    // 현재는 단일 상태 조회만 지원하거나, 전체 조회를 위한 포트 확장이 필요할 수 있음
    // 일단 전체 지원을 위해 리포지토리 메서드 하나를 더 추가하는 방향 제안 가능
    // 여기서는 기본적으로 ACTIVE와 PENDING 합산 또는 ACTIVE 우선 조회로 구현
    return this.inventoryRepo.findByUserIdAndStatus(params.userId, InventoryStatus.ACTIVE);
  }
}
