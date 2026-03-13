import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * QuestAdmin 모듈 베이스 예외
 */
export class QuestAdminException extends DomainException {
  constructor(
    message: string,
    errorCode: MessageCode,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, errorCode, httpStatus);
    this.name = 'QuestAdminException';
  }
}

/**
 * 관리 요청한 퀘스트를 찾을 수 없을 때 발생하는 예외
 */
export class AdminQuestNotFoundException extends QuestAdminException {
  constructor() {
    super(
      'Quest information not found',
      MessageCode.QUEST_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'AdminQuestNotFoundException';
  }
}
