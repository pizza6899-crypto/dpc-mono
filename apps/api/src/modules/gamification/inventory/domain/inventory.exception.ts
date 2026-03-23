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
