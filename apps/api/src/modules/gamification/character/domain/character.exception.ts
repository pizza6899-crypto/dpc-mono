import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * 게이미피케이션 캐릭터 모듈의 베이스 예외
 */
export class GamificationCharacterException extends DomainException {
  constructor(
    message: string,
    errorCode: MessageCode,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, errorCode, httpStatus);
    this.name = 'GamificationCharacterException';
  }
}

/**
 * 캐릭터 정보를 찾을 수 없을 때
 */
export class UserCharacterNotFoundException extends GamificationCharacterException {
  constructor() {
    super(
      'User character info not found.',
      MessageCode.GAMIFICATION_CHARACTER_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'UserCharacterNotFoundException';
  }
}

/**
 * 보유 스탯 포인트가 부족할 때
 */
export class InsufficientStatPointsException extends GamificationCharacterException {
  constructor() {
    super(
      'Insufficient stat points available.',
      MessageCode.GAMIFICATION_CHARACTER_INSUFFICIENT_STAT_POINTS,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InsufficientStatPointsException';
  }
}

/**
 * 스탯 투자 한도를 초과했을 때
 */
export class StatLimitExceededException extends GamificationCharacterException {
  constructor(stat: string, limit: number) {
    super(
      `Stat limit exceeded for ${stat}. Max limit: ${limit}`,
      MessageCode.GAMIFICATION_CHARACTER_STAT_LIMIT_EXCEEDED,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'StatLimitExceededException';
  }
}

/**
 * 유효하지 않은 스탯 타입일 때
 */
export class InvalidStatTypeException extends GamificationCharacterException {
  constructor(stat: string) {
    super(
      `Invalid stat type: ${stat}`,
      MessageCode.GAMIFICATION_CHARACTER_INVALID_STAT_TYPE,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InvalidStatTypeException';
  }
}

/**
 * 특정 통화에 대해 기 설정된 초기화 가격이 없거나 지원하지 않는 경우
 */
export class GamificationCurrencyNotSupportedException extends GamificationCharacterException {
  constructor() {
    super(
      'The requested currency is not supported for stat reset.',
      MessageCode.GAMIFICATION_CONFIG_CURRENCY_NOT_SUPPORTED,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'GamificationCurrencyNotSupportedException';
  }
}
