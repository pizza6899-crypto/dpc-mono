import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

export class GameRoundException extends DomainException {
  constructor(
    message: string,
    errorCode: MessageCode,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, errorCode, httpStatus);
  }
}

/**
 * 이미 종료된 라운드에 수정을 시도할 때 발생합니다.
 */
export class GameRoundAlreadyCompletedException extends GameRoundException {
  constructor(roundId: bigint) {
    super(
      `Round already completed: ${roundId}`,
      MessageCode.VALIDATION_ERROR, // 적절한 전용 메시지 코드가 없으면 기본 밸리데이션 에러 사용
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * 베팅/윈 금액 등이 유효하지 않을 때 발생합니다.
 */
export class InvalidGameRoundAmountException extends GameRoundException {
  constructor(message: string) {
    super(message, MessageCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST);
  }
}

/**
 * 게임 또는 사용자를 찾을 수 없는 경우 등 처리 중에 발생하는 예외입니다.
 * (필요에 따라 더 세분화할 수 있습니다)
 */
export class GameRoundProcessingException extends GameRoundException {
  constructor(message: string, errorCode: MessageCode = MessageCode.VALIDATION_ERROR) {
    super(message, errorCode, HttpStatus.BAD_REQUEST);
  }
}
