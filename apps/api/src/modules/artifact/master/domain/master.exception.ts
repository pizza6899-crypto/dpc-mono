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
  constructor(reason: string, code: MessageCode = MessageCode.ARTIFACT_INVALID_DRAW_PRICE) {
    super(reason, code);
    this.name = 'InvalidArtifactDrawPriceException';
  }
}

/**
 * [Artifact] 유물 뽑기 비용 수치 오류
 */
export class InvalidArtifactDrawPriceValueException extends InvalidArtifactDrawPriceException {
  constructor(type: string, currency: string, amount: number) {
    super(
      `Invalid price for ${type} in ${currency}: ${amount}. Price must be 0 or greater.`,
      MessageCode.ARTIFACT_INVALID_DRAW_PRICE_VALUE,
    );
    this.name = 'InvalidArtifactDrawPriceValueException';
  }
}

/**
 * [Artifact] 유물 합성 설정 오류
 */
export class InvalidArtifactSynthesisConfigException extends InvalidArtifactPolicyException {
  constructor(reason: string, code: MessageCode = MessageCode.ARTIFACT_INVALID_SYNTHESIS_CONFIG) {
    super(reason, code);
    this.name = 'InvalidArtifactSynthesisConfigException';
  }
}

/**
 * [Artifact] 유물 합성 필요 수량 오류
 */
export class InvalidArtifactSynthesisRequiredCountException extends InvalidArtifactSynthesisConfigException {
  constructor(grade: string, count: number) {
    super(
      `Required count for ${grade} must be greater than 0 (Received: ${count}).`,
      MessageCode.ARTIFACT_INVALID_SYNTHESIS_REQUIRED_COUNT,
    );
    this.name = 'InvalidArtifactSynthesisRequiredCountException';
  }
}

/**
 * [Artifact] 유물 합성 확률 오류
 */
export class InvalidArtifactSynthesisSuccessRateException extends InvalidArtifactSynthesisConfigException {
  constructor(grade: string, rate: number) {
    super(
      `Success rate for ${grade} must be between 0.0 and 1.0 (Received: ${rate}).`,
      MessageCode.ARTIFACT_INVALID_SYNTHESIS_SUCCESS_RATE,
    );
    this.name = 'InvalidArtifactSynthesisSuccessRateException';
  }
}

/**
 * [Artifact] 유물 합성 확정 획득 횟수(Pity) 오류
 */
export class InvalidArtifactSynthesisGuaranteedCountException extends InvalidArtifactSynthesisConfigException {
  constructor(grade: string, count: number) {
    super(
      `Guaranteed count (Pity) for ${grade} must be greater than 0 (Received: ${count}). To disable Pity, please omit the field.`,
      MessageCode.ARTIFACT_INVALID_SYNTHESIS_GUARANTEED_COUNT,
    );
    this.name = 'InvalidArtifactSynthesisGuaranteedCountException';
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
