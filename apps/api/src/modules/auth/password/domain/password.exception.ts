import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * 유효하지 않은 비밀번호 재설정 토큰 예외
 */
export class InvalidPasswordResetTokenException extends DomainException {
    constructor() {
        super(
            'Invalid or expired password reset token',
            MessageCode.PASSWORD_RESET_TOKEN_INVALID,
            HttpStatus.BAD_REQUEST,
        );
        this.name = 'InvalidPasswordResetTokenException';
    }
}
