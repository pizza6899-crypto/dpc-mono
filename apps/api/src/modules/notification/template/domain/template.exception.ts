// apps/api/src/modules/notification/template/domain/template.exception.ts

import { HttpStatus } from '@nestjs/common';
import { DomainException } from 'src/common/exception/domain.exception';
import { MessageCode } from '@repo/shared';
import { Language } from 'src/generated/prisma';

export class TemplateException extends DomainException {
    constructor(
        message: string,
        errorCode: MessageCode = MessageCode.INTERNAL_SERVER_ERROR,
        httpStatus: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    ) {
        super(message, errorCode, httpStatus);
    }
}

export class TemplateNotFoundException extends TemplateException {
    constructor(identifier: string | bigint) {
        super(
            `Template not found: ${identifier}`,
            MessageCode.NOTIFICATION_TEMPLATE_NOT_FOUND,
            HttpStatus.NOT_FOUND,
        );
    }
}

export class TemplateTranslationNotFoundException extends TemplateException {
    constructor(templateId: bigint, locale: string | Language) {
        super(
            `Translation not found for template ${templateId} and locale ${locale}`,
            MessageCode.NOTIFICATION_TEMPLATE_TRANSLATION_NOT_FOUND,
            HttpStatus.NOT_FOUND,
        );
    }
}

export class DuplicateTemplateException extends TemplateException {
    constructor(event: string, channel: string) {
        super(
            `Template already exists for event ${event} and channel ${channel}`,
            MessageCode.NOTIFICATION_TEMPLATE_ALREADY_EXISTS,
            HttpStatus.CONFLICT,
        );
    }
}

export class InvalidTemplateVariableException extends TemplateException {
    constructor(variable: string) {
        super(
            `Invalid or missing variable: ${variable}`,
            MessageCode.VALIDATION_ERROR,
            HttpStatus.BAD_REQUEST,
        );
    }
}
