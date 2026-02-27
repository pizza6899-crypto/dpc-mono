import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * UserConfig 모듈 베이스 예외
 */
export class UserConfigException extends DomainException {
    constructor(
        message: string,
        errorCode: MessageCode,
        httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
    ) {
        super(message, errorCode, httpStatus);
        this.name = 'UserConfigException';
    }
}

/**
 * 전역 설정을 찾을 수 없을 때 발생하는 예외 (ID: 1 누락 등)
 */
export class UserConfigNotFoundException extends UserConfigException {
    constructor() {
        super(
            'Global user configuration not found',
            MessageCode.USER_CONFIG_NOT_FOUND,
            HttpStatus.NOT_FOUND,
        );
        this.name = 'UserConfigNotFoundException';
    }
}
