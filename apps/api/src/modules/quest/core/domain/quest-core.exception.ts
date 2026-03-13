import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * QuestCore 모듈 베이스 예외
 */
export class QuestCoreException extends DomainException {
  constructor(
    message: string,
    errorCode: MessageCode,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, errorCode, httpStatus);
    this.name = 'QuestCoreException';
  }
}

/**
 * 퀘스트가 완료되지 않은 상태에서 보상을 수령하려 할 때 발생하는 예외
 */
export class QuestNotCompletedException extends QuestCoreException {
  constructor(status: string) {
    super(
      `Cannot claim reward: Quest status is ${status}`,
      MessageCode.QUEST_NOT_COMPLETED,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'QuestNotCompletedException';
  }
}

/**
 * 이미 보상을 수령한 퀘스트에 대해 다시 수령을 시도할 때 발생하는 예외
 */
export class QuestAlreadyClaimedException extends QuestCoreException {
  constructor() {
    super(
      'Quest reward has already been claimed',
      MessageCode.QUEST_ALREADY_CLAIMED,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'QuestAlreadyClaimedException';
  }
}

/**
 * 유저의 퀘스트 참여 내역을 찾을 수 없거나 권한이 없을 때 발생하는 예외
 */
export class UserQuestNotFoundException extends QuestCoreException {
  constructor() {
    super(
      'User quest not found or access denied',
      MessageCode.USER_QUEST_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'UserQuestNotFoundException';
  }
}
/**
 * 퀘스트 정보를 찾을 수 없을 때 발생하는 예외
 */
export class QuestNotFoundException extends QuestCoreException {
  constructor() {
    super(
      'Quest not found',
      MessageCode.QUEST_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'QuestNotFoundException';
  }
}
