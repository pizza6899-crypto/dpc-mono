import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  Logger,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import { RequestClientInfo } from 'src/common/http/types/client-info.types';

/**
 * Whitecliff 유효성 검사 실패 예외
 */
export class WhitecliffValidationException extends Error {
  constructor(public errors: any[]) {
    super('WhitecliffValidationException');
    Object.setPrototypeOf(this, WhitecliffValidationException.prototype);
  }
}

/**
 * Whitecliff 전용 예외 필터
 * 모든 예외를 잡아서 Whitecliff 규격의 에러 응답(Status 200)으로 변환
 * Response Format: { status: 0, balance: 0, error: 'ERROR_CODE' }
 */
@Catch()
export class WhitecliffExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(WhitecliffExceptionFilter.name);
  constructor(private readonly dispatchLogService: DispatchLogService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let errorCode = 'UNKNOWN_ERROR';
    const balance = 0;
    let logMessage = 'Internal Server Error';
    let stackTrace = '';

    if (exception instanceof BadRequestException) {
      // 1. DTO Validation 실패 (NestJS 기본 ValidationPipe)
      const responseBody = exception.getResponse() as any;
      logMessage = `Validation Error: ${JSON.stringify(responseBody.message)}`;
      errorCode = 'INVALID_PARAMETER';
    } else if (exception instanceof WhitecliffValidationException) {
      // 2. Custom Validation 실패 (WhitecliffValidationPipe)
      logMessage = `Validation Error: ${JSON.stringify(exception.errors)}`;
      errorCode = 'INVALID_PARAMETER';
    } else if (exception instanceof HttpException) {
      // 3. 기타 HTTP 예외 (403, 404 등)
      const status = exception.getStatus();
      logMessage = `HTTP Exception (${status}): ${exception.message}`;

      // 상태 코드별 화이트클리프 규격 매핑
      if (
        status === HttpStatus.FORBIDDEN ||
        status === HttpStatus.UNAUTHORIZED
      ) {
        errorCode = 'ACCESS_DENIED';
      }
    } else if (exception instanceof Error) {
      // 4. 일반 시스템 에러
      logMessage = exception.message;
      stackTrace = exception.stack || '';
    }

    this.logger.error(
      `[Whitecliff Exception] ${request.method} ${request.url} - ${logMessage}`,
      stackTrace,
    );

    // 시스템 로그 기록 (비동기)
    this.dispatchLogService
      .dispatch(
        {
          type: LogType.ERROR,
          data: {
            errorCode: errorCode,
            errorMessage: logMessage,
            stackTrace: stackTrace,
            path: request.url,
            method: request.method,
            severity: 'ERROR',
            metadata: {
              requestBody: request.body,
            },
          },
        },
        (request as any).clientInfo as RequestClientInfo,
      )
      .catch((err) =>
        this.logger.warn(`Failed to dispatch system log: ${err.message}`),
      );

    // Whitecliff 규격: 항상 200 OK
    response.status(HttpStatus.OK).json({
      status: 0,
      balance: balance,
      error: errorCode,
    });
  }
}
