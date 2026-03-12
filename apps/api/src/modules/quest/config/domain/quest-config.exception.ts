import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * QuestConfig 모듈 베이스 예외
 */
export class QuestConfigException extends DomainException {
  constructor(
    message: string,
    errorCode: MessageCode,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, errorCode, httpStatus);
    this.name = 'QuestConfigException';
  }
}

/**
 * 전역 퀘스트 설정을 찾을 수 없을 때 발생하는 예외 (ID: 1 누락 등)
 */
export class QuestConfigNotFoundException extends QuestConfigException {
  constructor() {
    super(
      'Global quest configuration not found',
      MessageCode.QUEST_CONFIG_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'QuestConfigNotFoundException';
  }
}
