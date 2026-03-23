import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { USER_INVENTORY_REPOSITORY_PORT } from '../ports/user-inventory.repository.port';
import type { UserInventoryRepositoryPort } from '../ports/user-inventory.repository.port';
import { SyncUserTotalStatsService } from '../../character/application/sync-user-total-stats.service';
import { InventoryItemNotFoundException } from '../domain/inventory.exception';
import { InventoryStatus } from '@prisma/client';

export interface RevokeInventoryItemAdminParams {
  inventoryId: bigint;
}

/**
 * 관리자가 유저의 아이템을 강제 회수/만료 처리하는 서비스
 */
@Injectable()
export class RevokeInventoryItemAdminService {
  constructor(
    @Inject(USER_INVENTORY_REPOSITORY_PORT)
    private readonly inventoryRepo: UserInventoryRepositoryPort,
    
    // 스탯 동기화를 위해 캐릭터 모듈의 서비스 주입 (순환 참조 대응)
    @Inject(forwardRef(() => SyncUserTotalStatsService))
    private readonly syncTotalStatsService: SyncUserTotalStatsService,
  ) { }

  /**
   * 아이템 회수 수행
   */
  @Transactional()
  async execute(params: RevokeInventoryItemAdminParams): Promise<void> {
    // 1. 단일 항목 조회
    const inventory = await this.inventoryRepo.findById(params.inventoryId);
    if (!inventory) {
      throw new InventoryItemNotFoundException();
    }

    const wasActive = inventory.status === InventoryStatus.ACTIVE;
    const userId = inventory.userId;

    // 2. 만료 처리 (상태를 직접 설정하거나 expire 메서드 활용)
    // 데이터 보존을 위해 완전 삭제 대신 EXPIRED 처리
    inventory.expire();

    // 3. 영속화
    await this.inventoryRepo.save(inventory);

    // 4. [중요] 만약 장착 중이던 유물/아이템을 회수했다면, 유저 스탯 동기화 재수행
    if (wasActive) {
      await this.syncTotalStatsService.execute(userId);
    }
  }
}
