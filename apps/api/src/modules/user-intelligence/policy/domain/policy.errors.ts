import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from '../../../../common/exception/domain.exception';

/**
 * 활성 정책을 찾을 수 없을 때 발생하는 도메인 예외
 */
export class PolicyNotFoundException extends DomainException {
  constructor(message: string = 'Active UserIntelligencePolicy not found. Please ensure the policy is seeded.') {
    super(message, MessageCode.USER_INTELLIGENCE_POLICY_NOT_FOUND, HttpStatus.NOT_FOUND);
  }
}

/**
 * 정책 설정 정보가 유효하지 않을 때 발생하는 도메인 예외
 */
export class PolicyInvalidConfigException extends DomainException {
  constructor(message: string = 'UserIntelligencePolicy configuration is invalid. Please check your config data.') {
    super(message, MessageCode.USER_INTELLIGENCE_POLICY_INVALID_CONFIG, HttpStatus.BAD_REQUEST);
  }
}
