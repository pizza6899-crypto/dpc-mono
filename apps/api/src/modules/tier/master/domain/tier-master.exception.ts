import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

export class TierMasterException extends DomainException {
    constructor(
        message: string,
        errorCode: MessageCode, // 명시적인 코드 사용을 위해 기본값 제거
        httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
    ) {
        super(message, errorCode, httpStatus);
        this.name = 'TierMasterException';
    }
}

export class TierSettingsNotFoundException extends TierMasterException {
    constructor() {
        super(
            'Tier settings not found', // 내부 ID 노출 없이 간결한 메시지 유지
            MessageCode.TIER_NOT_FOUND,
            HttpStatus.NOT_FOUND,
        );
        this.name = 'TierSettingsNotFoundException';
    }
}
