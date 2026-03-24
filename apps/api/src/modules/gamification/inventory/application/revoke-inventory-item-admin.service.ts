import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
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

    private readonly advisoryLockService: AdvisoryLockService,
  ) { }

  /**
   * 아이템 회수 수행
   */
  @Transactional()
  async execute(params: RevokeInventoryItemAdminParams): Promise<void> {
    // 1. 단일 항목 조회 (유저 ID 획득용)
    const inventory = await this.inventoryRepo.findById(params.inventoryId);
    if (!inventory) {
      throw new InventoryItemNotFoundException();
    }

    const userId = inventory.userId;

    // 2. 유저별 게이미피케이션 액션 권고락 획득 (회수 중 장착 상태 등 변경 방지)
    await this.advisoryLockService.acquireLock(
      LockNamespace.GAMIFICATION_CHARACTER,
      userId.toString(),
    );

    // 락 획득 후 최신 상태 다시 로드 (방어적 코드)
    const latestInventory = await this.inventoryRepo.findById(params.inventoryId);
    if (!latestInventory) throw new InventoryItemNotFoundException();

    const wasActive = latestInventory.status === InventoryStatus.ACTIVE;

    // 3. 만료 처리 (EXPIRED)
    latestInventory.expire();

    // 4. 영속화
    await this.inventoryRepo.save(latestInventory);

    // 5. [중요] 만약 장착 중이던 유물/아이템을 회수했다면, 유저 스탯 동기화 재수행
    if (wasActive) {
      await this.syncTotalStatsService.execute(userId);
    }
  }
}
