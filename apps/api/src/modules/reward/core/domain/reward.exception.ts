import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared'; // DPC-mono 공용 인터페이스
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * 1. Reward 모듈 베이스 예외
 */
export class RewardException extends DomainException {
    constructor(
        message: string,
        errorCode: MessageCode,
        httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
    ) {
        super(message, errorCode, httpStatus);
        this.name = 'RewardException';
    }
}

/**
 * 2. 구체적인 도메인 예외들
 */
export class RewardCannotBeClaimedException extends RewardException {
    constructor() {
        super(
            'Reward is not in a claimable state (already claimed or expired).', // 내부 ID 노출 없이 일반적 메시지
            MessageCode.REWARD_NOT_CLAIMABLE,                                   // 프론트 다국어용 키
            HttpStatus.BAD_REQUEST,
        );
        this.name = 'RewardCannotBeClaimedException';
    }
}

export class RewardOnlyPendingCanExpireException extends RewardException {
    constructor() {
        super(
            'Only PENDING rewards can be marked as expired.',
            MessageCode.REWARD_NOT_CLAIMABLE, // 적절히 매핑
            HttpStatus.BAD_REQUEST,
        );
        this.name = 'RewardOnlyPendingCanExpireException';
    }
}

export class RewardAlreadyClaimedCannotVoidException extends RewardException {
    constructor() {
        super(
            'Cannot void a reward that has already been claimed.',
            MessageCode.REWARD_NOT_CLAIMABLE, // 취소 관련 적절히 매핑
            HttpStatus.BAD_REQUEST,
        );
        this.name = 'RewardAlreadyClaimedCannotVoidException';
    }
}
