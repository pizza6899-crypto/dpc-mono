import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from '../exception/domain.exception';

/**
 * Snowflake 관련 기본 예외
 */
export class SnowflakeException extends DomainException {
  constructor(
    message: string,
    errorCode: MessageCode = MessageCode.INTERNAL_SERVER_ERROR,
    httpStatus: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super(message, errorCode, httpStatus);
  }
}

/**
 * 모든 노드 ID가 점유되어 할당할 수 없을 때 발생
 */
export class SnowflakeNodeIdOccupiedException extends SnowflakeException {
  constructor() {
    super(
      'No available Node ID for SnowflakeService. All IDs are occupied.',
      MessageCode.INTERNAL_SERVER_ERROR,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

/**
 * 노드 ID가 아직 할당되지 않은 상태에서 ID 생성을 시도할 때 발생
 */
export class SnowflakeNodeIdNotAssignedException extends SnowflakeException {
  constructor() {
    super(
      'SnowflakeService node ID is not assigned yet.',
      MessageCode.INTERNAL_SERVER_ERROR,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

/**
 * 시스템 시계가 역행했을 때 발생
 */
export class SnowflakeClockBackwardsException extends SnowflakeException {
  constructor(diff: bigint) {
    super(
      `Clock moved backwards. Refusing to generate id for ${diff}ms`,
      MessageCode.INTERNAL_SERVER_ERROR,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
