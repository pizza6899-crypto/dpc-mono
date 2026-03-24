/**
 * 인벤토리 로그 공통 메타데이터
 */
export interface BaseInventoryLogMetadata {
  description?: string;
  traceId?: string;
  adminId?: string;
  // 수량 변화 추적 (엔티티에 필드가 없으므로 메타데이터에서 관리)
  prev_qty?: number | null;
  curr_qty?: number | null;
}

/**
 * 아이템 지급(GRANT/REFILL) 메타데이터
 */
export interface InventoryGrantMetadata extends BaseInventoryLogMetadata {
  reasonCode?: string;
  source?: 'ADMIN' | 'SYSTEM' | 'REWARD' | 'PROMOTION';
}

/**
 * 아이템 장착/해제(EQUIP/UNEQUIP) 메타데이터
 */
export interface InventoryEquipMetadata extends BaseInventoryLogMetadata {
  previousSlot?: string | null;
  currentSlot?: string | null;
}

/**
 * 아이템 소모/만료(CONSUME/EXPIRE) 메타데이터
 */
export interface InventoryConsumeMetadata extends BaseInventoryLogMetadata {
  consumeType?: 'DAILY_USAGE' | 'MANUAL_CONSUME' | 'DURABILITY_LOSS';
  usageAmount?: number;
}

/**
 * 아이템 파기(DISCARD) 메타데이터
 */
export interface InventoryDiscardMetadata extends BaseInventoryLogMetadata {
  reason?: string;
}

/**
 * 기본/기타 메타데이터
 */
export interface InventoryDefaultMetadata extends BaseInventoryLogMetadata {}

/**
 * 모든 인벤토리 로그 메타데이터의 유니온 타입
 */
export type AnyInventoryLogMetadata =
  | InventoryGrantMetadata
  | InventoryEquipMetadata
  | InventoryConsumeMetadata
  | InventoryDiscardMetadata
  | InventoryDefaultMetadata;
