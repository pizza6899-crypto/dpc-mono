// apps/api/src/modules/notification/alert/domain/alert.exception.ts

import { HttpStatus } from '@nestjs/common';
import { DomainException } from 'src/common/exception/domain.exception';
import { MessageCode } from '@repo/shared';

export class AlertException extends DomainException {
    constructor(
        message: string,
        errorCode: MessageCode = MessageCode.INTERNAL_SERVER_ERROR,
        httpStatus: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    ) {
        super(message, errorCode, httpStatus);
    }
}

export class AlertNotFoundException extends AlertException {
    constructor(identifier: string | bigint) {
        super(
            `Alert not found: ${identifier}`,
            MessageCode.NOTIFICATION_ALERT_NOT_FOUND,
            HttpStatus.NOT_FOUND,
        );
    }
}

export class DuplicateAlertException extends AlertException {
    constructor(idempotencyKey: string) {
        super(
            `Duplicate alert with idempotency key: ${idempotencyKey}`,
            MessageCode.NOTIFICATION_ALERT_ALREADY_EXISTS,
            HttpStatus.CONFLICT,
        );
    }
}

export class InvalidAlertStatusTransitionException extends AlertException {
    constructor(currentStatus: string, targetStatus: string) {
        super(
            `Invalid status transition from ${currentStatus} to ${targetStatus}`,
            MessageCode.NOTIFICATION_ALERT_INVALID_STATUS_TRANSITION,
            HttpStatus.BAD_REQUEST,
        );
    }
}
