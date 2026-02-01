import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

export class TierRewardException extends DomainException {
    constructor(
        message: string,
        errorCode: MessageCode,
        httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
    ) {
        super(message, errorCode, httpStatus);
        this.name = 'TierRewardException';
    }
}

export class RewardNotFoundException extends TierRewardException {
    constructor() {
        super(
            'Reward not found',
            MessageCode.TIER_REWARD_NOT_FOUND,
            HttpStatus.NOT_FOUND,
        );
    }
}

export class RewardNotPendingException extends TierRewardException {
    constructor(status: string) {
        super(
            `Reward cannot be claimed/cancelled in ${status} status`,
            MessageCode.TIER_REWARD_NOT_PENDING,
            HttpStatus.CONFLICT,
        );
    }
}

export class RewardExpiredException extends TierRewardException {
    constructor() {
        super(
            'Reward has expired',
            MessageCode.TIER_REWARD_EXPIRED,
            HttpStatus.GONE,
        );
    }
}

export class RewardOwnerMismatchException extends TierRewardException {
    constructor() {
        super(
            'Reward owner mismatch',
            MessageCode.TIER_REWARD_OWNER_MISMATCH,
            HttpStatus.FORBIDDEN,
        );
    }
}
