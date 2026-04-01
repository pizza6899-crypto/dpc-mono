import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * [Artifact Synthesis] 유물 합성 관련 공통 비즈니스 예외 기반 클래스
 */
export abstract class ArtifactSynthesisException extends DomainException {
  constructor(errorCode: MessageCode, status: HttpStatus) {
    // DomainException은 (message, errorCode, httpStatus) 순서임
    super(errorCode, errorCode, status);
  }
}

/**
 * 합성 재료가 유효하지 않음 (소유권 위반, 등급 혼합, 개수 부족 등 통합)
 */
export class InvalidSynthesisIngredientsException extends ArtifactSynthesisException {
  constructor() {
    super(
      MessageCode.ARTIFACT_SYNTHESIS_INVALID_INGREDIENTS,
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * 해당 등급에 대한 합성 정책(성공확률 등)이 설정되지 않음
 */
export class SynthesisPolicyNotConfiguredException extends ArtifactSynthesisException {
  constructor() {
    super(
      MessageCode.ARTIFACT_SYNTHESIS_POLICY_NOT_FOUND,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * 최고 등급(UNIQUE 등)은 더 이상 상위 합성이 불가능함
 */
export class MaxGradeSynthesisException extends ArtifactSynthesisException {
  constructor() {
    super(
      MessageCode.ARTIFACT_SYNTHESIS_MAX_GRADE_REACHED,
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * 블록체인 데이터 동기화 실패 (블록해시 누락 등)
 */
export class BlockchainSyncException extends ArtifactSynthesisException {
  constructor() {
    super(
      MessageCode.BLOCKCHAIN_SYNC_ERROR,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
