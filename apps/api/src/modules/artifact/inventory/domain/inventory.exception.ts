import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * [Artifact Inventory] 도메인 공통 예외
 */
export abstract class ArtifactInventoryException extends DomainException { }

/**
 * 유물 소유권을 찾을 수 없거나 접근 권한이 없는 경우
 */
export class UserArtifactNotFoundException extends ArtifactInventoryException {
  constructor() {
    super(
      'User artifact not found or access denied.',
      MessageCode.ARTIFACT_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * 슬롯 번호가 유효하지 않은 경우 (잠김 등)
 */
export class InvalidArtifactSlotException extends ArtifactInventoryException {
  constructor() {
    super(
      'Invalid or locked artifact slot number.',
      MessageCode.ARTIFACT_INVALID_SLOT,
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * 이미 장착 중인 유물인 경우
 */
export class ArtifactAlreadyEquippedException extends ArtifactInventoryException {
  constructor() {
    super(
      'Artifact is already equipped.',
      MessageCode.ARTIFACT_ALREADY_EQUIPPED,
      HttpStatus.BAD_REQUEST,
    );
  }
}
