import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    BadRequestException,
    Logger,
    HttpStatus,
    HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { DcsResponseCode, getDcsResponse } from '../constants/dcs-response-codes';

/**
 * DCS 유효성 검사 실패 예외
 * ValidationPipe에서 발생한 에러를 DCS 포맷으로 변환하기 위해 사용됩니다.
 */
export class DcsValidationException extends RegExp {
    constructor(public errors: any[]) {
        super('DcsValidationException');
    }
}

/**
 * DCS 전용 예외 필터
 * NestJS ValidationPipe에서 발생하는 BadRequestException이나
 * DcsValidationException을 잡아서 DCS 규격의 200 OK 응답으로 변환합니다.
 */
@Catch()
export class DcsExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(DcsExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let dcsError: ReturnType<typeof getDcsResponse>;
        let statusCode = HttpStatus.OK; // DCS는 에러여도 항상 200 OK

        // 로깅을 위한 에러 정보 추출
        let errorMessage = 'Unknown Error';
        let stackTrace = '';

        if (exception instanceof BadRequestException) {
            // 1. DTO Validation 실패 (400 Bad Request)
            const responseBody = exception.getResponse() as any;
            errorMessage = `Validation Error: ${JSON.stringify(responseBody.message)}`;
            dcsError = getDcsResponse(DcsResponseCode.REQUEST_PARAM_ERROR);
        } else if (exception instanceof DcsValidationException) {
            // 2. Custom DTO Validation 실패
            errorMessage = `Validation Error: ${JSON.stringify(exception.errors)}`;
            dcsError = getDcsResponse(DcsResponseCode.REQUEST_PARAM_ERROR);
        } else if (exception instanceof HttpException) {
            // 3. 기타 HTTP 예외 (404, 403 등)
            errorMessage = `HTTP Exception: ${exception.message}`;
            dcsError = getDcsResponse(DcsResponseCode.SYSTEM_ERROR);
        } else {
            // 4. 알 수 없는 시스템 에러 (DB 에러, 로직 에러 등 500)
            const error = exception as Error;
            errorMessage = error.message;
            stackTrace = error.stack || '';
            dcsError = getDcsResponse(DcsResponseCode.SYSTEM_ERROR);
        }

        this.logger.error(
            `[DCS Exception] ${request.method} ${request.url} - ${errorMessage}`,
            stackTrace,
        );

        response.status(statusCode).json(dcsError);
    }
}
