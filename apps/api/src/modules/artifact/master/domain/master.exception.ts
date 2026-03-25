import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * 유물 마스터 모듈의 베이스 예외
 */
export abstract class ArtifactMasterException extends DomainException {
  constructor(message: string, errorCode: MessageCode, httpStatus: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, errorCode, httpStatus);
    this.name = 'ArtifactMasterException';
  }
}

/**
 * [Artifact] 유물 정책을 찾을 수 없는 경우
 */
export class ArtifactPolicyNotFoundException extends ArtifactMasterException {
  constructor() {
    super(
      'Artifact policy not found.',
      MessageCode.ARTIFACT_POLICY_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'ArtifactPolicyNotFoundException';
  }
}

/**
 * [Artifact] 존재하지 않는 유물 정보인 경우 (ID 노출 방지)
 */
export class ArtifactCatalogNotFoundException extends ArtifactMasterException {
  constructor() {
    super(
      'Artifact catalog not found.',
      MessageCode.ARTIFACT_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'ArtifactCatalogNotFoundException';
  }
}

/**
 * [Artifact] 뽑기 확률 설정 오류
 */
export class InvalidArtifactDrawProbabilityException extends ArtifactMasterException {
  constructor(reason: string = 'Invalid artifact draw probability configuration.') {
    super(
      reason,
      MessageCode.ARTIFACT_INVALID_PROBABILITY,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InvalidArtifactDrawProbabilityException';
  }
}

/**
 * [Artifact] 특정 등급에 유물이 하나도 없는 경우 (가중치 랜덤 불가)
 */
export class NoArtifactsForGradeException extends ArtifactMasterException {
  constructor(grade: string) {
    super(
      `No artifacts found for grade: ${grade}. Check master data configuration.`,
      MessageCode.ARTIFACT_NOT_FOUND,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    this.name = 'NoArtifactsForGradeException';
  }
}
