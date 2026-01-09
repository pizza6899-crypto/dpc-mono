import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

export class AnalyticsDomainException extends DomainException {
    constructor(
        message: string,
        errorCode: MessageCode = MessageCode.VALIDATION_ERROR,
        httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
    ) {
        super(message, errorCode, httpStatus);
    }
}

export class UserHourlyStatNotFoundException extends AnalyticsDomainException {
    constructor(userId: bigint, date: Date, currency: string) {
        super(
            `User hourly stat not found for user: ${userId}, date: ${date.toISOString()}, currency: ${currency}`,
            MessageCode.ANALYTICS_STATS_NOT_FOUND,
            HttpStatus.NOT_FOUND,
        );
    }
}

export class AnalyticsInvalidParameterException extends AnalyticsDomainException {
    constructor(message: string) {
        super(
            message,
            MessageCode.ANALYTICS_INVALID_PARAMETER,
            HttpStatus.BAD_REQUEST,
        );
    }
}

export class AnalyticsInvalidDateRangeException extends AnalyticsDomainException {
    constructor(startAt: Date, endAt: Date) {
        super(
            `Invalid date range: ${startAt.toISOString()} - ${endAt.toISOString()}`,
            MessageCode.ANALYTICS_INVALID_DATE_RANGE,
            HttpStatus.BAD_REQUEST,
        );
    }
}
