import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * 유물 상태 모듈의 베이스 예외
 */
export abstract class ArtifactStatusException extends DomainException {
  constructor(message: string, errorCode: MessageCode, httpStatus: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, errorCode, httpStatus);
    this.name = 'ArtifactStatusException';
  }
}

/**
 * [Artifact Status] 유저의 유물 상태 정보를 찾을 수 없는 경우
 */
export class ArtifactStatusNotFoundException extends ArtifactStatusException {
  constructor() {
    super(
      `Artifact status not found.`,
      MessageCode.ARTIFACT_STATUS_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'ArtifactStatusNotFoundException';
  }
}

/**
 * [Artifact Status] 티켓 잔액이 부족한 경우
 */
export class InsufficientArtifactTicketsException extends ArtifactStatusException {
  constructor(message: string) {
    super(
      message,
      MessageCode.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InsufficientArtifactTicketsException';
  }
}
