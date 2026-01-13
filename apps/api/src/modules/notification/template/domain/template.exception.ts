// apps/api/src/modules/notification/template/domain/template.exception.ts

import { DomainException } from 'src/common/exception/domain.exception';

export class TemplateException extends DomainException {
    constructor(message: string) {
        super(message);
    }
}

export class TemplateNotFoundException extends TemplateException {
    constructor(identifier: string | bigint) {
        super(`Template not found: ${identifier}`);
    }
}

export class TemplateTranslationNotFoundException extends TemplateException {
    constructor(templateId: bigint, locale: string) {
        super(`Translation not found for template ${templateId} and locale ${locale}`);
    }
}

export class DuplicateTemplateException extends TemplateException {
    constructor(event: string, channel: string) {
        super(`Template already exists for event ${event} and channel ${channel}`);
    }
}

export class InvalidTemplateVariableException extends TemplateException {
    constructor(variable: string) {
        super(`Invalid or missing variable: ${variable}`);
    }
}
