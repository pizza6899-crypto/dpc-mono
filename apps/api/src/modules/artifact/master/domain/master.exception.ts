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
 * [Artifact] 뽑기 확률 설정 오류 (Base/Legacy)
 */
export class InvalidArtifactDrawProbabilityException extends ArtifactMasterException {
  constructor(reason: string = 'Invalid artifact draw probability configuration.', code: MessageCode = MessageCode.ARTIFACT_INVALID_PROBABILITY) {
    super(reason, code, HttpStatus.BAD_REQUEST);
    this.name = 'InvalidArtifactDrawProbabilityException';
  }
}

/**
 * [Artifact] 개별 확률 범위 오류 (0.0 ~ 1.0)
 */
export class ArtifactProbabilityOutOfRangeException extends InvalidArtifactDrawProbabilityException {
  constructor(grade: string, value: number) {
    super(
      `Probability for grade ${grade} is out of range: ${value} (must be 0.0 ~ 1.0)`,
      MessageCode.ARTIFACT_PROBABILITY_OUT_OF_RANGE,
    );
    this.name = 'ArtifactProbabilityOutOfRangeException';
  }
}

/**
 * [Artifact] 확률 총합 오류 (반드시 1.0)
 */
export class ArtifactProbabilitySumException extends InvalidArtifactDrawProbabilityException {
  constructor(sum: number) {
    super(
      `Total probability must be 1.0 (Current: ${sum.toFixed(6)})`,
      MessageCode.ARTIFACT_PROBABILITY_SUM_INVALID,
    );
    this.name = 'ArtifactProbabilitySumException';
  }
}

/**
 * [Artifact] 모든 등급이 포함되지 않았거나 중복인 경우
 */
export class ArtifactGradesIncompleteException extends InvalidArtifactDrawProbabilityException {
  constructor(expected: number, received: number) {
    super(
      `All artifact grades must be included uniquely. (Expected: ${expected}, Received Unique: ${received})`,
      MessageCode.ARTIFACT_GRADES_INCOMPLETE,
    );
    this.name = 'ArtifactGradesIncompleteException';
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

/**
 * [Artifact] 뽑기 확률 설정을 찾을 수 없는 경우
 */
export class ArtifactDrawConfigNotFoundException extends ArtifactMasterException {
  constructor(grade: string) {
    super(
      `Artifact draw configuration for grade ${grade} not found.`,
      MessageCode.ARTIFACT_DRAW_CONFIG_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'ArtifactDrawConfigNotFoundException';
  }
}

/**
 * [Artifact] 유물 정책 설정 오류 (Base)
 */
export class InvalidArtifactPolicyException extends ArtifactMasterException {
  constructor(reason: string = 'Invalid artifact policy configuration.', code: MessageCode = MessageCode.ARTIFACT_INVALID_POLICY) {
    super(reason, code, HttpStatus.BAD_REQUEST);
    this.name = 'InvalidArtifactPolicyException';
  }
}

/**
 * [Artifact] 유물 뽑기 비용 설정 오류
 */
export class InvalidArtifactDrawPriceException extends InvalidArtifactPolicyException {
  constructor(reason: string) {
    super(reason, MessageCode.ARTIFACT_INVALID_DRAW_PRICE);
    this.name = 'InvalidArtifactDrawPriceException';
  }
}

/**
 * [Artifact] 유물 정책 필수 설정 누락
 */
export class ArtifactPolicyIncompleteException extends InvalidArtifactPolicyException {
  constructor(missingType: string) {
    super(
      `Required artifact policy type '${missingType}' is missing or has no currency price defined.`,
      MessageCode.ARTIFACT_POLICY_INCOMPLETE,
    );
    this.name = 'ArtifactPolicyIncompleteException';
  }
}
