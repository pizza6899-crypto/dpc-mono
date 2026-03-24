import { InventoryStatus, ItemSlot } from '@prisma/client';
import { InsufficientItemQuantityException, InventoryItemInvalidStateException } from './inventory.exception';

/**
 * [Gamification] 유저 인벤토리 아이템 도메인 엔티티
 * 
 * 유저가 소유한 아이템(유물, 소모품 등)의 상태와 장착 슬롯을 관리하고
 * 사용, 장착, 만료 등의 비즈니스 로직을 수행합니다.
 */
export class UserInventory {
  private constructor(
    private readonly _id: bigint,
    private readonly _userId: bigint,
    private readonly _itemId: bigint,
    private _quantity: number,
    private _status: InventoryStatus,
    private _slot: ItemSlot | null,
    private _remainingUsageCount: number | null,
    private _activatedAt: Date | null,
    private _lastUsedAt: Date | null,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) { }

  /**
   * 영속성 계층에서 복원
   */
  static rehydrate(data: {
    id: bigint;
    userId: bigint;
    itemId: bigint;
    quantity: number;
    status: InventoryStatus;
    slot: ItemSlot | null;
    remainingUsageCount: number | null;
    activatedAt: Date | null;
    lastUsedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserInventory {
    return new UserInventory(
      data.id,
      data.userId,
      data.itemId,
      data.quantity,
      data.status,
      data.slot,
      data.remainingUsageCount,
      data.activatedAt,
      data.lastUsedAt,
      data.createdAt,
      data.updatedAt,
    );
  }

  /**
   * 새로운 인벤토리 항목 생성 (ID는 DB에서 발급받기 전까지 0으로 처리)
   */
  static create(params: {
    userId: bigint;
    itemId: bigint;
    quantity?: number;
    maxUsageCount?: number | null;
  }): UserInventory {
    const now = new Date();
    return new UserInventory(
      0n, // DB 저장 시 할당 예정
      params.userId,
      params.itemId,
      params.quantity ?? 1,
      InventoryStatus.PENDING,
      null,
      params.maxUsageCount ?? null,
      null,
      null,
      now,
      now,
    );
  }

  // --- 비즈니스 로직 메서드 ---

  /**
   * 아이템 장착 (슬롯 지정)
   */
  equip(slot: ItemSlot): void {
    if (this._status === InventoryStatus.EXPIRED || this._status === InventoryStatus.CONSUMED) {
      throw new InventoryItemInvalidStateException('Cannot equip an expired or consumed item');
    }

    this._status = InventoryStatus.ACTIVE;
    this._slot = slot;
    if (!this._activatedAt) {
      this._activatedAt = new Date();
    }
    this._updatedAt = new Date();
  }

  /**
   * 아이템 해제 (장착 해제)
   */
  unequip(): void {
    this._status = InventoryStatus.PENDING;
    this._slot = null;
    this._updatedAt = new Date();
  }

  /**
   * 아이템 자동 데일리 소모 처리
   * 매일 1회 한도로 사용 횟수를 차감하며, 횟수 소진 시 CONSUMED 처리합니다.
   */
  useDaily(): void {
    if (this._status !== InventoryStatus.ACTIVE) {
      throw new InventoryItemInvalidStateException('Only active items can be used daily');
    }

    // 횟수 제한이 있는 경우에만 차감
    if (this._remainingUsageCount !== null) {
      if (this._remainingUsageCount <= 0) {
        this.expire();
        return;
      }

      this._remainingUsageCount -= 1;
      this._lastUsedAt = new Date();

      if (this._remainingUsageCount === 0) {
        this.expire();
      }
    } else {
      // 무제한 아이템이라도 마지막 사용 일시는 업데이트
      this._lastUsedAt = new Date();
    }

    this._updatedAt = new Date();
  }

  /**
   * 아이템 소모 (수량 차감)
   */
  consume(amount: number = 1): void {
    if (this._quantity < amount) {
      throw new InsufficientItemQuantityException();
    }

    if (this._status === InventoryStatus.EXPIRED) {
      throw new InventoryItemInvalidStateException('Cannot consume an expired item');
    }

    this._quantity -= amount;
    if (this._quantity === 0) {
      this._status = InventoryStatus.CONSUMED;
      this._slot = null;
    }
    this._updatedAt = new Date();
  }

  /**
   * 아이템 활성화 (소모품 등을 사용 개시할 때)
   */
  activate(): void {
    if (this._status === InventoryStatus.EXPIRED || this._status === InventoryStatus.CONSUMED) {
      throw new InventoryItemInvalidStateException('Cannot activate an expired or consumed item');
    }

    this._status = InventoryStatus.ACTIVE;
    this._activatedAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * 만료 처리 (횟수 소진 등)
   */
  expire(): void {
    if (this._status === InventoryStatus.EXPIRED || this._status === InventoryStatus.CONSUMED) return;

    this._status = InventoryStatus.EXPIRED;
    this._slot = null;
    this._updatedAt = new Date();
  }

  /**
   * 사용 가능 여부 확인
   */
  canBeUsed(): boolean {
    if (this._status === InventoryStatus.EXPIRED || this._status === InventoryStatus.CONSUMED) return false;
    if (this._remainingUsageCount !== null && this._remainingUsageCount <= 0) return false;
    return true;
  }

  // --- Getters ---
  get id(): bigint { return this._id; }
  get userId(): bigint { return this._userId; }
  get itemId(): bigint { return this._itemId; }
  get quantity(): number { return this._quantity; }
  get status(): InventoryStatus { return this._status; }
  get slot(): ItemSlot | null { return this._slot; }
  get remainingUsageCount(): number | null { return this._remainingUsageCount; }
  get activatedAt(): Date | null { return this._activatedAt; }
  get lastUsedAt(): Date | null { return this._lastUsedAt; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
}
