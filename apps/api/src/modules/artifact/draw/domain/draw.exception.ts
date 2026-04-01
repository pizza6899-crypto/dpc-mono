import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * [Artifact Draw] 유물 뽑기 모듈의 베이스 예외
 */
export abstract class ArtifactDrawException extends DomainException {
  constructor(message: string, errorCode: MessageCode, httpStatus: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, errorCode, httpStatus);
    this.name = 'ArtifactDrawException';
  }
}

/**
 * [Artifact Draw] 특정 통화에 대한 뽑기 비용이 설정되지 않은 경우
 */
export class ArtifactDrawPriceNotFoundException extends ArtifactDrawException {
  constructor(currencyCode: string) {
    super(
      `Draw price not defined for currency: ${currencyCode}. Please check artifact policy configuration.`,
      MessageCode.ARTIFACT_POLICY_INCOMPLETE,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'ArtifactDrawPriceNotFoundException';
  }
}

/**
 * [Artifact Draw] 재화 결제 시 통화 코드가 누락된 경우
 */
export class CurrencyCodeRequiredException extends ArtifactDrawException {
  constructor() {
    super(
      'Currency code is required for currency payment.',
      MessageCode.ARTIFACT_INVALID_DRAW_PRICE,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'CurrencyCodeRequiredException';
  }
}

/**
 * [Artifact Draw] 유효하지 않은 뽑기 요청인 경우 (일반 오류)
 */
export class InvalidArtifactDrawRequestException extends ArtifactDrawException {
  constructor(reason: string = 'Invalid artifact draw request.') {
    super(
      reason,
      MessageCode.ARTIFACT_INVALID_DRAW_PRICE,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InvalidArtifactDrawRequestException';
  }
}

/**
 * [Artifact Draw] 뽑기 요청을 찾을 수 없는 경우
 */
export class ArtifactDrawRequestNotFoundException extends ArtifactDrawException {
  constructor() {
    super(
      'Artifact draw request not found.',
      MessageCode.ARTIFACT_DRAW_REQUEST_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'ArtifactDrawRequestNotFoundException';
  }
}

/**
 * [Artifact Draw] 소유자가 아닌 유저가 결과를 확인하려는 경우
 */
export class UnauthorizedDrawClaimException extends ArtifactDrawException {
  constructor() {
    super(
      'Unauthorized attempt to claim draw result.',
      MessageCode.AUTH_INSUFFICIENT_PERMISSIONS,
      HttpStatus.FORBIDDEN,
    );
    this.name = 'UnauthorizedDrawClaimException';
  }
}

/**
 * [Artifact Draw] 결과 산출 전이거나 이미 확인된 상태에서 재확인하려는 경우
 */
export class InvalidDrawStatusException extends ArtifactDrawException {
  constructor(status: string) {
    super(
      `Draw request is in invalid status for this action: ${status}`,
      MessageCode.ARTIFACT_DRAW_INVALID_STATUS,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InvalidDrawStatusException';
  }
}

/**
 * [Claim] 아직 타겟 슬롯에 도달하지 않아 결과를 산출할 수 없는 경우
 */
export class DrawNotSettledYetException extends ArtifactDrawException {
  constructor() {
    super(
      'Draw result is not ready yet. Please wait a few seconds.',
      MessageCode.ARTIFACT_DRAW_NOT_SETTLED,
      HttpStatus.ACCEPTED, // 202 Accepted (아직 진행 중임을 시사)
    );
    this.name = 'DrawNotSettledYetException';
  }
}

/**
 * [Settle] 필요한 블록해시를 가져올 수 없는 경우 (무결성 오류)
 */
export class SolanaBlockhashMissingException extends ArtifactDrawException {
  constructor(slot: number) {
    super(
      `Integrity Error: Blockhash missing for slot ${slot}. Result cannot be generated safely.`,
      MessageCode.BLOCKCHAIN_SYNC_ERROR,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    this.name = 'SolanaBlockhashMissingException';
  }
}
