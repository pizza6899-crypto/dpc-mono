import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

export class CatalogException extends DomainException {
  constructor(
    message: string,
    errorCode: MessageCode,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, errorCode, httpStatus);
  }
}

export class CategoryNotFoundException extends CatalogException {
  constructor() {
    super(
      'Category not found',
      MessageCode.CASINO_CATEGORY_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class GameNotFoundException extends CatalogException {
  constructor() {
    super('Game not found', MessageCode.GAME_NOT_FOUND, HttpStatus.NOT_FOUND);
  }
}

export class CategoryAlreadyExistsException extends CatalogException {
  constructor() {
    super(
      'Category with code already exists',
      MessageCode.CASINO_CATEGORY_ALREADY_EXISTS,
      HttpStatus.CONFLICT,
    );
  }
}

export class CategoryValidationException extends CatalogException {
  constructor(message: string) {
    super(message, MessageCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST);
  }
}
