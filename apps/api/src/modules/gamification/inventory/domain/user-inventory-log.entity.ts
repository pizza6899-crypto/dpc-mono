import type { InventoryAction, ItemSlot } from '@prisma/client';
import type { AnyInventoryLogMetadata } from './user-inventory-log-metadata';

/**
 * 인벤토리 로그 생성을 위한 파라미터 인터페이스
 */
export interface CreateUserInventoryLogParams {
  id: bigint; // Snowflake ID 외부 주입 필수
  createdAt: Date; // 파티셔닝용 생성 시각 외부 주입 필수
  inventoryId: bigint;
  userId: bigint;
  itemId: bigint;
  action: InventoryAction;
  slot?: ItemSlot | null;
  previousUsageCount?: number | null;
  currentUsageCount?: number | null;
  actorId?: string | null;
  reason?: string | null;
  metadata?: AnyInventoryLogMetadata | null;
}

/**
 * [Gamification] 유저 인벤토리 활동 로그 도메인 엔티티
 */
export class UserInventoryLog {
  private constructor(
    private readonly _id: bigint,
    private readonly _createdAt: Date,
    private readonly _inventoryId: bigint,
    private readonly _userId: bigint,
    private readonly _itemId: bigint,
    private readonly _action: InventoryAction,
    private readonly _slot: ItemSlot | null,
    private readonly _previousUsageCount: number | null,
    private readonly _currentUsageCount: number | null,
    private readonly _actorId: string | null,
    private readonly _reason: string | null,
    private readonly _metadata: AnyInventoryLogMetadata | null,
  ) { }

  /**
   * 영속성 계층에서 복원
   */
  static rehydrate(data: {
    id: bigint;
    createdAt: Date;
    inventoryId: bigint;
    userId: bigint;
    itemId: bigint;
    action: InventoryAction;
    slot: ItemSlot | null;
    previousUsageCount: number | null;
    currentUsageCount: number | null;
    actorId: string | null;
    reason: string | null;
    metadata: AnyInventoryLogMetadata | null;
  }): UserInventoryLog {
    return new UserInventoryLog(
      data.id,
      data.createdAt,
      data.inventoryId,
      data.userId,
      data.itemId,
      data.action,
      data.slot,
      data.previousUsageCount,
      data.currentUsageCount,
      data.actorId,
      data.reason,
      data.metadata,
    );
  }

  /**
   * 새로운 로그 생성 (팩토리 메서드 - Snowflake ID 및 생성 시각 주입 필수)
   */
  static create(params: CreateUserInventoryLogParams): UserInventoryLog {
    return new UserInventoryLog(
      params.id,
      params.createdAt,
      params.inventoryId,
      params.userId,
      params.itemId,
      params.action,
      params.slot ?? null,
      params.previousUsageCount ?? null,
      params.currentUsageCount ?? null,
      params.actorId ?? null,
      params.reason ?? null,
      params.metadata ?? null,
    );
  }

  // --- Getters ---
  get id(): bigint { return this._id; }
  get inventoryId(): bigint { return this._inventoryId; }
  get userId(): bigint { return this._userId; }
  get itemId(): bigint { return this._itemId; }
  get action(): InventoryAction { return this._action; }
  get slot(): ItemSlot | null { return this._slot; }
  get previousUsageCount(): number | null { return this._previousUsageCount; }
  get currentUsageCount(): number | null { return this._currentUsageCount; }
  get actorId(): string | null { return this._actorId; }
  get reason(): string | null { return this._reason; }
  get metadata(): AnyInventoryLogMetadata | null { return this._metadata; }
  get createdAt(): Date { return this._createdAt; }
}
