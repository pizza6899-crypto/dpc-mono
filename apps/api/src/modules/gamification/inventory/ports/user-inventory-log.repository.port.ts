import type { InventoryAction, ItemSlot } from '@prisma/client';
import type { UserInventoryLog } from '../domain/user-inventory-log.entity';

export const USER_INVENTORY_LOG_REPOSITORY_PORT = Symbol('USER_INVENTORY_LOG_REPOSITORY_PORT');

/**
 * 인벤토리 로그 검색 파라미터
 */
export interface FindInventoryLogsParams {
  userId?: bigint;
  inventoryId?: bigint;
  itemId?: bigint;
  action?: InventoryAction;
  slot?: ItemSlot;
  limit?: number;
  offset?: number;
  from?: Date;
  to?: Date;
}

/**
 * [Gamification] 유저 인벤토리 로그 리포지토리 포트
 * 로그는 불변 데이터이므로 생성(insert)과 조회(find)만 지원합니다.
 */
export interface UserInventoryLogRepositoryPort {
  /**
   * 새로운 인벤토리 로그 생성 (불변 데이터)
   */
  create(log: UserInventoryLog): Promise<void>;

  /**
   * 고유 ID와 생성 시각(파티셔닝 키)으로 상세 조회
   */
  findById(id: bigint, createdAt: Date): Promise<UserInventoryLog | null>;

  /**
   * 조건별 로그 목록 조회
   */
  findMany(params: FindInventoryLogsParams): Promise<UserInventoryLog[]>;

  /**
   * 조건별 로그 총 개수 조회 (페이지네이션용)
   */
  count(params: FindInventoryLogsParams): Promise<number>;
}
