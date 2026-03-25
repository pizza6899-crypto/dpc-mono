import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * 유저 캐릭터 모듈의 베이스 예외
 */
export class UserCharacterException extends DomainException {
  constructor(
    message: string,
    errorCode: MessageCode,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, errorCode, httpStatus);
    this.name = 'UserCharacterException';
  }
}

/**
 * 캐릭터 정보를 찾을 수 없을 때
 */
export class UserCharacterNotFoundException extends UserCharacterException {
  constructor() {
    super(
      'User character info not found.',
      MessageCode.CHARACTER_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'UserCharacterNotFoundException';
  }
}

/**
 * 보유 스탯 포인트가 부족할 때
 */
export class InsufficientStatPointsException extends UserCharacterException {
  constructor() {
    super(
      'Insufficient stat points available.',
      MessageCode.CHARACTER_INSUFFICIENT_STAT_POINTS,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InsufficientStatPointsException';
  }
}

/**
 * 스탯 투자 한도를 초과했을 때
 */
export class StatLimitExceededException extends UserCharacterException {
  constructor(stat: string, limit: number) {
    super(
      `Stat limit exceeded for ${stat}. Max limit: ${limit}`,
      MessageCode.CHARACTER_STAT_LIMIT_EXCEEDED,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'StatLimitExceededException';
  }
}

/**
 * 유효하지 않은 스탯 타입일 때
 */
export class InvalidStatTypeException extends UserCharacterException {
  constructor(stat: string) {
    super(
      `Invalid stat type: ${stat}`,
      MessageCode.CHARACTER_INVALID_STAT_TYPE,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InvalidStatTypeException';
  }
}

/**
 * 특정 통화에 대해 기 설정된 초기화 가격이 없거나 지원하지 않는 경우
 */
export class CharacterCurrencyNotSupportedException extends UserCharacterException {
  constructor() {
    super(
      'The requested currency is not supported for stat reset.',
      MessageCode.CHARACTER_CONFIG_CURRENCY_NOT_SUPPORTED,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'CharacterCurrencyNotSupportedException';
  }
}
