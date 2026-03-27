import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from '../../../../common/exception/domain.exception';

/**
 * 지능형 평가 점수를 찾을 수 없을 때 발생하는 도메인 예외
 */
export class ScoreNotFoundException extends DomainException {
  constructor(message: string = 'User intelligence score not found') {
    super(message, MessageCode.USER_INTELLIGENCE_SCORE_NOT_FOUND, HttpStatus.NOT_FOUND);
  }
}
