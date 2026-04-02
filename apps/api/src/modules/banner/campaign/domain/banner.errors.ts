import { HttpStatus } from '@nestjs/common';
import { Language } from '@prisma/client';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

export class BannerException extends DomainException {
  constructor(message: string, code: MessageCode = MessageCode.VALIDATION_ERROR, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, code, status);
  }
}

export class BannerNotFoundException extends BannerException {
  constructor() {
    super(`The requested banner could not be found.`, MessageCode.BANNER_NOT_FOUND, HttpStatus.NOT_FOUND);
  }
}

export class BannerTranslationNotFoundException extends BannerException {
  constructor() {
    super(`Banner translation not found.`, MessageCode.BANNER_TRANSLATION_NOT_FOUND, HttpStatus.NOT_FOUND);
  }
}

export class BannerDuplicateTranslationException extends BannerException {
  constructor() {
    super(`Duplicate banner translation.`, MessageCode.BANNER_DUPLICATE_TRANSLATION, HttpStatus.CONFLICT);
  }
}

export class BannerInvalidDateRangeException extends BannerException {
  constructor(start?: Date | null, end?: Date | null) {
    super(
      `Invalid banner date range. start=${start?.toISOString() ?? 'null'}, end=${end?.toISOString() ?? 'null'}`,
      MessageCode.BANNER_INVALID_DATE_RANGE,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class BannerInvalidStateException extends BannerException {
  constructor(reason?: string) {
    super(reason ?? 'Invalid banner state.', MessageCode.BANNER_INVALID_STATE, HttpStatus.BAD_REQUEST);
  }
}

export class BannerInvalidImageFileIdException extends BannerException {
  constructor(index?: number) {
    super(
      `Invalid imageFileId${index !== undefined ? ` at translations[${index}]` : ''}`,
      // If specific message code not defined, fall back to validation error
      (MessageCode as any).BANNER_INVALID_IMAGE_FILE_ID ?? MessageCode.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export default {
  BannerException,
  BannerNotFoundException,
  BannerTranslationNotFoundException,
  BannerDuplicateTranslationException,
  BannerInvalidDateRangeException,
  BannerInvalidStateException,
  BannerInvalidImageFileIdException,
};
