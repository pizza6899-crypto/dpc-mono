import { HttpStatus } from '@nestjs/common';
import { DomainException } from 'src/common/exception/domain.exception';
import { MessageCode } from '@repo/shared';

/**
 * 콘텐츠 검토 관련 기본 도메인 예외
 */
export class ModerationException extends DomainException {
    constructor(
        message: string,
        code: MessageCode = MessageCode.VALIDATION_ERROR,
        status: HttpStatus = HttpStatus.BAD_REQUEST,
    ) {
        super(message, code, status);
    }
}

/**
 * 금지어/예약어 포함 시 발생하는 예외
 */
export class ForbiddenWordException extends ModerationException {
    constructor(word: string) {
        // [Security] API 응답에는 구체적인 금지어를 노출하지 않습니다. (Fuzzing 방지 및 한글 필터링 우회)
        super(`The content contains a forbidden word.`, MessageCode.VALIDATION_ERROR);
    }
}

/**
 * AI 검토 결과 부적절 판정 시 발생하는 예외
 */
export class AiModerationRejectedException extends ModerationException {
    constructor(
        reason?: string,
        public readonly flaggedWords: string[] = [],
    ) {
        super(reason || 'The content was rejected by AI moderation policy.', MessageCode.VALIDATION_ERROR);
    }
}
