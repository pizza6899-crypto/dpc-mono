// apps/api/src/modules/notification/alert/domain/alert.exception.ts

import { DomainException } from 'src/common/exception/domain.exception';

export class AlertException extends DomainException {
    constructor(message: string) {
        super(message);
    }
}

export class AlertNotFoundException extends AlertException {
    constructor(identifier: string | bigint) {
        super(`Alert not found: ${identifier}`);
    }
}

export class DuplicateAlertException extends AlertException {
    constructor(idempotencyKey: string) {
        super(`Duplicate alert with idempotency key: ${idempotencyKey}`);
    }
}

export class InvalidAlertStatusTransitionException extends AlertException {
    constructor(currentStatus: string, targetStatus: string) {
        super(`Invalid status transition from ${currentStatus} to ${targetStatus}`);
    }
}
