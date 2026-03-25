import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * 캐릭터 마스터 모듈의 베이스 예외
 */
export abstract class CharacterMasterException extends DomainException {
  constructor(message: string, errorCode: MessageCode, httpStatus: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, errorCode, httpStatus);
    this.name = 'CharacterMasterException';
  }
}

// --- Not Found 계열 (ID 노출 지양) ---

/** 캐릭터 전역 설정을 찾을 수 없을 때 (Seeding 누락 등) */
export class CharacterConfigNotFoundException extends CharacterMasterException {
  constructor() {
    super(
      'Character configuration not found. Please check database seeding.',
      MessageCode.CHARACTER_CONFIG_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'CharacterConfigNotFoundException';
  }
}

/** 특정 레벨 정의를 찾을 수 없을 때 */
export class LevelDefinitionNotFoundException extends CharacterMasterException {
  constructor() {
    super(
      'Level definition not found.',
      MessageCode.LEVEL_DEFINITION_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'LevelDefinitionNotFoundException';
  }
}

// --- Validation 계열 (상세 사유 중심) ---

// --- Character Config 계열 ---

/** 캐릭터 설정 파라미터가 유효하지 않을 때 */
export class InvalidCharacterConfigException extends CharacterMasterException {
  constructor(messageCode: MessageCode, reason: string) {
    super(reason, messageCode, HttpStatus.BAD_REQUEST);
    this.name = 'InvalidCharacterConfigException';
  }
}

/** 경험치 배율 설정이 잘못되었을 때 */
export class InvalidXPMultiplierException extends InvalidCharacterConfigException {
  constructor(reason: string = 'XP multiplier cannot be negative.') {
    super(MessageCode.CHARACTER_CONFIG_XP_MULTIPLIER_NEGATIVE, reason);
    this.name = 'InvalidXPMultiplierException';
  }
}

/** 레벨당 지급 스탯 포인트 설정이 잘못되었을 때 */
export class InvalidStatPointsPerLevelException extends InvalidCharacterConfigException {
  constructor(reason: string = 'Stat points grant per level cannot be negative.') {
    super(MessageCode.CHARACTER_CONFIG_STAT_POINTS_NEGATIVE, reason);
    this.name = 'InvalidStatPointsPerLevelException';
  }
}

/** 최대 스탯 제한 설정이 잘못되었을 때 */
export class InvalidMaxStatLimitException extends InvalidCharacterConfigException {
  constructor(reason: string = 'Max stat limit must be at least 1.') {
    super(MessageCode.CHARACTER_CONFIG_STAT_LIMIT_NEGATIVE, reason);
    this.name = 'InvalidMaxStatLimitException';
  }
}

/** 스탯 초기화 가격 설정이 잘못되었을 때 */
export class InvalidResetPriceException extends InvalidCharacterConfigException {
  constructor(reason: string) {
    super(MessageCode.CHARACTER_CONFIG_PRICE_NEGATIVE, reason);
    this.name = 'InvalidResetPriceException';
  }
}

/** 레벨 정의 파라미터가 유효하지 않을 때 */
export class InvalidLevelDefinitionException extends CharacterMasterException {
  constructor(messageCode: MessageCode, reason: string) {
    super(reason, messageCode, HttpStatus.BAD_REQUEST);
    this.name = 'InvalidLevelDefinitionException';
  }
}

/** 레벨당 필요 경험치 설정이 잘못되었을 때 */
export class InvalidLevelRequiredXPException extends InvalidLevelDefinitionException {
  constructor(reason: string = 'Required XP cannot be negative.') {
    super(MessageCode.CHARACTER_LEVEL_REQUIRED_XP_NEGATIVE, reason);
    this.name = 'InvalidLevelRequiredXPException';
  }
}

/** 레벨당 지급 스탯 포인트 설정이 잘못되었을 때 */
export class InvalidLevelUpStatPointsException extends InvalidLevelDefinitionException {
  constructor(reason: string = 'Stat points boost cannot be negative.') {
    super(MessageCode.CHARACTER_LEVEL_STAT_BOOST_NEGATIVE, reason);
    this.name = 'InvalidLevelUpStatPointsException';
  }
}
