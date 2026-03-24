import { Inject, Injectable } from '@nestjs/common';
import { InventoryAction, ItemSlot } from '@prisma/client';
import { USER_INVENTORY_LOG_REPOSITORY_PORT } from '../ports/user-inventory-log.repository.port';
import type { UserInventoryLogRepositoryPort, FindInventoryLogsParams } from '../ports/user-inventory-log.repository.port';
import { InventoryLogAdminResponseDto } from '../controllers/admin/dto/response/inventory-log-admin.response.dto';
import { PaginatedData } from 'src/common/http/types/pagination.types';

/**
 * 서비스 실행을 위한 순수 파라미터 인터페이스
 */
export interface FindInventoryLogsServiceParams {
  userId?: bigint;
  inventoryId?: bigint;
  itemId?: bigint;
  action?: InventoryAction;
  slot?: ItemSlot;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

/**
 * [Admin] 인벤토리 활동 로그 조회 서비스
 */
@Injectable()
export class FindInventoryLogsAdminService {
  constructor(
    @Inject(USER_INVENTORY_LOG_REPOSITORY_PORT)
    private readonly logRepo: UserInventoryLogRepositoryPort,
  ) { }

  /**
   * 필터 조건에 따른 로그 목록 조회 및 DTO 변환
   */
  async execute(params: FindInventoryLogsServiceParams): Promise<PaginatedData<InventoryLogAdminResponseDto>> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    const queryParams: FindInventoryLogsParams = {
      userId: params.userId,
      inventoryId: params.inventoryId,
      itemId: params.itemId,
      action: params.action,
      slot: params.slot,
      limit: limit,
      offset: offset,
      from: params.from,
      to: params.to,
    };

    const [items, total] = await Promise.all([
      this.logRepo.findMany(queryParams),
      this.logRepo.count(queryParams),
    ]);

    const dtos: InventoryLogAdminResponseDto[] = items.map(log => ({
      id: log.id.toString(),
      inventoryId: log.inventoryId.toString(),
      userId: log.userId.toString(),
      itemId: log.itemId.toString(),
      action: log.action,
      slot: log.slot,
      previousUsageCount: log.previousUsageCount,
      currentUsageCount: log.currentUsageCount,
      actorId: log.actorId,
      reason: log.reason,
      metadata: log.metadata,
      createdAt: log.createdAt,
    }));

    return {
      data: dtos,
      total,
      page,
      limit,
    };
  }
}
