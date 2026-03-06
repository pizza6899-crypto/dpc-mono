import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * AdminMemo 관련 기본 예외
 */
export class AdminMemoException extends DomainException {
    constructor(
        message: string,
        errorCode: MessageCode,
        httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
    ) {
        super(message, errorCode, httpStatus);
        this.name = 'AdminMemoException';
    }
}

/**
 * 메모 내용이 비어있을 때 발생하는 예외
 */
export class AdminMemoContentEmptyException extends AdminMemoException {
    constructor() {
        super(
            'Admin memo content cannot be empty',
            MessageCode.ADMIN_MEMO_CONTENT_EMPTY,
            HttpStatus.BAD_REQUEST,
        );
        this.name = 'AdminMemoContentEmptyException';
    }
}

