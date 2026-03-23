import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * 게이미피케이션 카탈로그 모듈의 베이스 예외
 */
export class GamificationCatalogException extends DomainException {
  constructor(
    message: string,
    errorCode: MessageCode,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, errorCode, httpStatus);
    this.name = 'GamificationCatalogException';
  }
}

/**
 * 게이미피케이션 전역 설정을 찾을 수 없을 때 (Seeding 누락 등)
 */
export class GamificationConfigNotFoundException extends GamificationCatalogException {
  constructor() {
    super(
      'Gamification configuration not found. Please check database seeding.',
      MessageCode.GAMIFICATION_CONFIG_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'GamificationConfigNotFoundException';
  }
}

/**
 * 게이미피케이션 관련 설정 파라미터가 유효하지 않을 때
 */
export class InvalidGamificationConfigParameterException extends GamificationCatalogException {
  constructor(messageCode: MessageCode, message: string = 'Invalid gamification parameter.') {
    super(
      message,
      messageCode,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InvalidGamificationConfigParameterException';
  }
}

/**
 * 특정 레벨 정의를 찾을 수 없을 때
 */
export class LevelDefinitionNotFoundException extends GamificationCatalogException {
  constructor(level: number) {
    super(
      `Level definition not found for level: ${level}`,
      MessageCode.LEVEL_DEFINITION_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'LevelDefinitionNotFoundException';
  }
}
