import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

export class CatalogException extends DomainException {
    constructor(message: string, errorCode: MessageCode, httpStatus: HttpStatus = HttpStatus.BAD_REQUEST) {
        super(message, errorCode, httpStatus);
    }
}

export class CategoryNotFoundException extends CatalogException {
    constructor(identifier: string | bigint) {
        super(`Category not found: ${identifier}`, MessageCode.CASINO_CATEGORY_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
}

export class GameNotFoundException extends CatalogException {
    constructor(identifier: string | bigint) {
        super(`Game not found: ${identifier}`, MessageCode.GAME_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
}

export class CategoryAlreadyExistsException extends CatalogException {
    constructor(code: string) {
        super(`Category with code already exists: ${code}`, MessageCode.CASINO_CATEGORY_ALREADY_EXISTS, HttpStatus.CONFLICT);
    }
}
