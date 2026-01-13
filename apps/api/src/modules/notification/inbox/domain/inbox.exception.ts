// apps/api/src/modules/notification/inbox/domain/inbox.exception.ts

import { DomainException } from 'src/common/exception/domain.exception';

export class InboxException extends DomainException {
    constructor(message: string) {
        super(message);
    }
}

export class NotificationLogNotFoundException extends InboxException {
    constructor(identifier: string | bigint) {
        super(`Notification not found: ${identifier}`);
    }
}

export class NotificationAlreadyReadException extends InboxException {
    constructor(id: bigint) {
        super(`Notification already read: ${id}`);
    }
}

export class NotificationAlreadyDeletedException extends InboxException {
    constructor(id: bigint) {
        super(`Notification already deleted: ${id}`);
    }
}

export class UnauthorizedNotificationAccessException extends InboxException {
    constructor(notificationId: bigint, userId: bigint) {
        super(`User ${userId} cannot access notification ${notificationId}`);
    }
}
