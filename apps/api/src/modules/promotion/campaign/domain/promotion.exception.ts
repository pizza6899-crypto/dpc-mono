import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * 프로모션 도메인 기본 예외
 */
export class PromotionException extends DomainException {
  constructor(
    message: string,
    errorCode: MessageCode = MessageCode.VALIDATION_ERROR,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, errorCode, httpStatus);
    this.name = 'PromotionException';
  }
}

/**
 * 프로모션을 찾을 수 없는 경우
 */
export class PromotionNotFoundException extends PromotionException {
  constructor() {
    super(
      'Promotion not found',
      MessageCode.PROMOTION_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'PromotionNotFoundException';
  }
}

/**
 * 프로모션 번역 정보를 찾을 수 없는 경우
 */
export class PromotionTranslationNotFoundException extends PromotionException {
  constructor() {
    super(
      'Promotion translation not found',
      MessageCode.PROMOTION_TRANSLATION_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'PromotionTranslationNotFoundException';
  }
}

/**
 * 프로모션이 활성 상태가 아닌 경우 (기간 만료 포함)
 */
export class PromotionNotActiveException extends PromotionException {
  constructor() {
    super(
      'The promotion is currently not active or has expired',
      MessageCode.PROMOTION_NOT_ACTIVE,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'PromotionNotActiveException';
  }
}

/**
 * 프로모션 참여 자격이 없는 경우 (입금액 미달, 타겟 미달 등)
 */
export class PromotionNotEligibleException extends PromotionException {
  constructor(reason?: string) {
    super(
      reason ? `Promotion eligibility failed: ${reason}` : 'You are not eligible for this promotion',
      MessageCode.PROMOTION_NOT_ELIGIBLE,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'PromotionNotEligibleException';
  }
}

/**
 * 이미 사용한 프로모션인 경우
 */
export class PromotionAlreadyUsedException extends PromotionException {
  constructor(customMessage?: string) {
    super(
      customMessage ?? 'This promotion has already been used',
      MessageCode.PROMOTION_ALREADY_USED,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'PromotionAlreadyUsedException';
  }
}

/**
 * 프로모션 선착순/사용 한도를 초과한 경우
 */
export class PromotionUsageLimitExceededException extends PromotionException {
  constructor() {
    super(
      'The maximum usage limit for this promotion has been reached',
      MessageCode.PROMOTION_NOT_ELIGIBLE,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'PromotionUsageLimitExceededException';
  }
}

/**
 * 사용자 프로모션 참여 기록을 찾을 수 없는 경우
 */
export class UserPromotionNotFoundException extends PromotionException {
  constructor() {
    super(
      'Participation record not found',
      MessageCode.PROMOTION_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'UserPromotionNotFoundException';
  }
}

/**
 * 프로모션 설정이 올바르지 않은 경우 (Admin용)
 */
export class PromotionInvalidConfigurationException extends PromotionException {
  constructor(reason?: string) {
    super(
      reason
        ? `Invalid promotion configuration: ${reason}`
        : 'Invalid promotion configuration',
      MessageCode.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'PromotionInvalidConfigurationException';
  }
}

/**
 * 프로모션 요청 파라미터가 누락되었거나 올바르지 않은 경우
 */
export class PromotionInvalidRequestException extends PromotionException {
  constructor(message: string) {
    super(message, MessageCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST);
    this.name = 'PromotionInvalidRequestException';
  }
}

/**
 * 프로모션 조회를 위해 언어 설정이 필요한 경우
 */
export class PromotionLanguageRequiredException extends PromotionException {
  constructor() {
    super(
      'User language is required',
      MessageCode.PROMOTION_LANGUAGE_REQUIRED,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'PromotionLanguageRequiredException';
  }
}

/**
 * 프로모션 조회를 위해 통화 설정이 필요한 경우
 */
export class PromotionCurrencyRequiredException extends PromotionException {
  constructor() {
    super(
      'User currency is required',
      MessageCode.PROMOTION_CURRENCY_REQUIRED,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'PromotionCurrencyRequiredException';
  }
}
