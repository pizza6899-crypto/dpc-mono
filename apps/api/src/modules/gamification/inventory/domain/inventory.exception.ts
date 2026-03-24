import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * 게이미피케이션 인벤토리 모듈의 베이스 예외
 */
export class GamificationInventoryException extends DomainException {
  constructor(
    message: string,
    errorCode: MessageCode,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, errorCode, httpStatus);
    this.name = 'GamificationInventoryException';
  }
}

/**
 * 인벤토리 아이템을 찾을 수 없을 때
 */
export class InventoryItemNotFoundException extends GamificationInventoryException {
  constructor() {
    super(
      'Inventory item not found.',
      MessageCode.INVENTORY_ITEM_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'InventoryItemNotFoundException';
  }
}

/**
 * 아이템 수량이 부족할 때
 */
export class InsufficientItemQuantityException extends GamificationInventoryException {
  constructor() {
    super(
      'Insufficient item quantity in inventory.',
      MessageCode.INVENTORY_INSUFFICIENT_QUANTITY,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InsufficientItemQuantityException';
  }
}

/**
 * 아이템 상태가 작업을 수행하기에 유효하지 않을 때 (이미 만료, 소모 등)
 */
export class InventoryItemInvalidStateException extends GamificationInventoryException {
  constructor(reason: string) {
    super(
      `Invalid inventory item state: ${reason}`,
      MessageCode.INVENTORY_INVALID_STATE,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InventoryItemInvalidStateException';
  }
}

/**
 * 해당 아이템이 사용자의 소유가 아닐 때 (보안 권한 부족)
 */
export class InventoryItemOwnershipException extends GamificationInventoryException {
  constructor() {
    super(
      'This inventory item does not belong to you.',
      MessageCode.INVENTORY_ITEM_OWNERSHIP_UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
    );
    this.name = 'InventoryItemOwnershipException';
  }
}

/**
 * 아이템이 이미 장착되어 있어 장착할 수 없을 때
 */
export class InventoryItemAlreadyEquippedException extends GamificationInventoryException {
  constructor() {
    super(
      'This item is already equipped.',
      MessageCode.INVENTORY_ITEM_ALREADY_EQUIPPED,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InventoryItemAlreadyEquippedException';
  }
}

/**
 * 지정된 슬롯이 아이템 타입과 맞지 않을 때
 */
export class InventoryItemInvalidSlotException extends GamificationInventoryException {
  constructor() {
    super(
      'The specified slot is invalid for this item type.',
      MessageCode.INVENTORY_ITEM_INVALID_SLOT,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InventoryItemInvalidSlotException';
  }
}

/**
 * 아이템이 만료되어 사용할 수 없을 때
 */
export class InventoryItemExpiredException extends GamificationInventoryException {
  constructor() {
    super(
      'This inventory item has expired.',
      MessageCode.INVENTORY_ITEM_EXPIRED,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InventoryItemExpiredException';
  }
}

/**
 * 아이템 수량을 모두 소모하여 사용할 수 없을 때
 */
export class InventoryItemConsumedException extends GamificationInventoryException {
  constructor() {
    super(
      'This inventory item has been fully consumed.',
      MessageCode.INVENTORY_ITEM_CONSUMED,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InventoryItemConsumedException';
  }
}
