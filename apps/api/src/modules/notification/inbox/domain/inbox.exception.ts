// apps/api/src/modules/notification/inbox/domain/inbox.exception.ts

import { HttpStatus } from '@nestjs/common';
import { DomainException } from 'src/common/exception/domain.exception';
import { MessageCode } from '@repo/shared';

export class InboxException extends DomainException {
    constructor(
        message: string,
        errorCode: MessageCode = MessageCode.INTERNAL_SERVER_ERROR,
        httpStatus: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    ) {
        super(message, errorCode, httpStatus);
    }
}

export class NotificationLogNotFoundException extends InboxException {
    constructor(identifier: string | bigint) {
        super(
            `Notification not found: ${identifier}`,
            MessageCode.NOTIFICATION_NOT_FOUND,
            HttpStatus.NOT_FOUND,
        );
    }
}

export class NotificationAlreadyReadException extends InboxException {
    constructor(id: bigint) {
        super(
            `Notification already read: ${id}`,
            MessageCode.NOTIFICATION_ALREADY_READ,
            HttpStatus.BAD_REQUEST, // Or Conflict
        );
    }
}

export class NotificationAlreadyDeletedException extends InboxException {
    constructor(id: bigint) {
        super(
            `Notification already deleted: ${id}`,
            MessageCode.NOTIFICATION_ALREADY_DELETED,
            HttpStatus.GONE, // Or Bad Request
        );
    }
}

export class UnauthorizedNotificationAccessException extends InboxException {
    constructor(notificationId: bigint, userId: bigint) {
        super(
            `User ${userId} cannot access notification ${notificationId}`,
            MessageCode.NOTIFICATION_ACCESS_DENIED,
            HttpStatus.FORBIDDEN,
        );
    }
}
