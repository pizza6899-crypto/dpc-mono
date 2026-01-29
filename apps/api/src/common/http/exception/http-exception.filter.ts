import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponseDto } from '../types/response.types';
import { nowUtcIso } from 'src/utils/date.util';
import { MessageCode } from '../types/message-codes';
import { ApiException } from './api.exception';
import { DomainException } from '../../exception/domain.exception';
import { sanitizeApiMessage, hasKorean } from 'src/utils/message.util';
import { extractClientInfo } from '../utils/request-info.util';
import { Prisma } from '@prisma/client';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';

interface ErrorDetails {
  status: number;
  messageCode: MessageCode;
  message: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly dispatchLogService?: DispatchLogService) { }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, messageCode, message } = this.resolveErrorDetails(exception);

    // 로그에는 상세 정보 기록 (서버 내부용)
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${exception instanceof Error ? exception.message : 'Unknown error'}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    let finalMessage = message;

    // 한글 감지 및 로깅
    if (finalMessage && hasKorean(finalMessage)) {
      this.logKoreanDetected(request, finalMessage, exception);
      // 한글 메시지는 빈 문자열로 정제
      finalMessage = sanitizeApiMessage(finalMessage);
    }

    const errorResponse: ErrorResponseDto = {
      success: false,
      messageCode, // 🎯 메시지 코드만
      message: finalMessage,
      timestamp: nowUtcIso(),
      statusCode: status, // HTTP 상태 코드
    };

    response.status(status).json(errorResponse);

    // 🛑 심각한 에러(500대 혹은 DB 에러)는 별도 Audit Log 기록
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR || messageCode === MessageCode.DB_QUERY_ERROR) {
      this.dispatchCriticalError(request, exception, messageCode, finalMessage);
    }
  }

  private resolveErrorDetails(exception: unknown): ErrorDetails {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handlePrismaError(exception);
    }

    if (exception instanceof ApiException) {
      return {
        status: exception.getStatus(),
        messageCode: exception.messageCode,
        message: exception.message,
      };
    }

    // DomainException 상속 클래스 처리 (FileValidationException 등)
    if (exception instanceof DomainException) {
      return {
        status: exception.httpStatus,
        messageCode: exception.errorCode,
        message: exception.message,
      };
    }

    // Domain Exception (errorCode + httpStatus pattern)
    if (
      exception instanceof Error &&
      'errorCode' in exception &&
      'httpStatus' in exception
    ) {
      const domainException = exception as any;
      return {
        status: domainException.httpStatus,
        messageCode: domainException.errorCode,
        message: domainException.message,
      };
    }

    if (exception instanceof Error) {
      const name = exception.constructor.name;
      if (name.includes('AffiliateCode')) {
        return this.handleAffiliateCodeError(exception);
      }
      if (name.includes('Referral')) {
        return this.handleReferralError(exception);
      }
    }

    if (exception instanceof HttpException) {
      return this.handleNestHttpException(exception);
    }

    const isProduction = process.env.NODE_ENV === 'production';
    let message = exception instanceof Error ? exception.message : 'Unknown error';

    if (isProduction) {
      message = 'Internal Server Error';
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      messageCode: MessageCode.INTERNAL_SERVER_ERROR,
      message,
    };
  }

  private handlePrismaError(error: Prisma.PrismaClientKnownRequestError): ErrorDetails {
    let messageCode = MessageCode.DB_QUERY_ERROR;
    let userMessage = 'Database request failed';
    let status = HttpStatus.INTERNAL_SERVER_ERROR; // 기본값은 서버 에러 (500)

    switch (error.code) {
      case 'P2002':
        // 중복 키 등 제약조건 위반 -> 유저 입력 실수 (409 Conflict가 맞으나 편의상 400 사용)
        messageCode = MessageCode.DB_CONSTRAINT_VIOLATION;
        userMessage = 'Unique constraint violation';
        status = HttpStatus.BAD_REQUEST;
        break;
      case 'P2025':
        // 레코드를 찾을 수 없음 -> 유저 요청 리소스 부재 (404)
        messageCode = MessageCode.USER_NOT_FOUND;
        userMessage = 'Record not found';
        status = HttpStatus.NOT_FOUND;
        break;
      default:
        // 그 외 DB 연결 오류 등은 시스템 장애 (500)
        if (process.env.NODE_ENV !== 'production') {
          userMessage = error.message;
        } else {
          // [Security] Production 환경에선 상세 원인 은폐
          messageCode = MessageCode.INTERNAL_SERVER_ERROR;
          userMessage = 'Internal Server Error';
        }
    }

    return {
      status,
      messageCode,
      message: userMessage,
    };
  }

  private handleAffiliateCodeError(error: Error): ErrorDetails {
    const errorMap: Record<string, { status: number; code: MessageCode }> = {
      AffiliateCodeLimitExceededException: { status: HttpStatus.BAD_REQUEST, code: MessageCode.AFFILIATE_CODE_LIMIT_EXCEEDED },
      AffiliateCodeAlreadyExistsException: { status: HttpStatus.CONFLICT, code: MessageCode.AFFILIATE_CODE_ALREADY_EXISTS },
      AffiliateCodeNotFoundException: { status: HttpStatus.NOT_FOUND, code: MessageCode.AFFILIATE_CODE_NOT_FOUND },
      AffiliateCodeCannotDeleteException: { status: HttpStatus.BAD_REQUEST, code: MessageCode.AFFILIATE_CODE_CANNOT_DELETE },
      AffiliateCodeException: { status: HttpStatus.BAD_REQUEST, code: MessageCode.AFFILIATE_CODE_INVALID_FORMAT },
    };

    const match = errorMap[error.constructor.name];
    if (match) {
      return { status: match.status, messageCode: match.code, message: error.message };
    }

    return {
      status: HttpStatus.BAD_REQUEST,
      messageCode: MessageCode.VALIDATION_ERROR,
      message: error.message,
    };
  }

  private handleReferralError(error: Error): ErrorDetails {
    const errorMap: Record<string, { status: number; code: MessageCode }> = {
      ReferralCodeNotFoundException: { status: HttpStatus.NOT_FOUND, code: MessageCode.REFERRAL_CODE_NOT_FOUND },
      ReferralCodeInactiveException: { status: HttpStatus.BAD_REQUEST, code: MessageCode.REFERRAL_CODE_INVALID_FORMAT },
      ReferralCodeExpiredException: { status: HttpStatus.BAD_REQUEST, code: MessageCode.REFERRAL_CODE_INVALID_FORMAT },
      SelfReferralException: { status: HttpStatus.BAD_REQUEST, code: MessageCode.REFERRAL_CODE_INVALID_FORMAT },
      DuplicateReferralException: { status: HttpStatus.CONFLICT, code: MessageCode.REFERRAL_CODE_ALREADY_EXISTS },
      ReferralException: { status: HttpStatus.BAD_REQUEST, code: MessageCode.REFERRAL_CODE_INVALID_FORMAT },
    };

    const match = errorMap[error.constructor.name];
    if (match) {
      return { status: match.status, messageCode: match.code, message: error.message };
    }

    return {
      status: HttpStatus.BAD_REQUEST,
      messageCode: MessageCode.VALIDATION_ERROR,
      message: error.message,
    };
  }

  private handleNestHttpException(error: HttpException): ErrorDetails {
    const status = error.getStatus();
    const response = error.getResponse();
    let messageCode = MessageCode.INTERNAL_SERVER_ERROR;
    let message = '';

    // 밸리데이션 에러 처리 (class-validator)
    if (status === HttpStatus.BAD_REQUEST && typeof response === 'object' && response !== null) {
      const respAny = response as any;
      if ('details' in respAny && Array.isArray(respAny.details) && respAny.details.length > 0) {
        messageCode = MessageCode.VALIDATION_ERROR;
        const constraint = respAny.details[0].constraints;
        message = constraint ? constraint[Object.keys(constraint)[0]] : 'Validation error';
        return { status, messageCode, message };
      } else if ('message' in respAny) {
        // 기본 NestJS 밸리데이션 에러 구조 처리
        messageCode = MessageCode.VALIDATION_ERROR;
        message = Array.isArray(respAny.message) ? respAny.message[0] : respAny.message;
        return { status, messageCode, message };
      }
    }

    // 일반 HTTP 상태 코드 매핑
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        messageCode = MessageCode.AUTH_INVALID_TOKEN;
        break;
      case HttpStatus.FORBIDDEN:
        messageCode = MessageCode.AUTH_TOKEN_EXPIRED;
        break;
      case HttpStatus.NOT_FOUND:
        messageCode = MessageCode.USER_NOT_FOUND;
        break;
      default:
        messageCode = MessageCode.INTERNAL_SERVER_ERROR;
    }

    // response가 string일 수도 있음
    if (typeof response === 'string') {
      message = response;
    } else if (typeof response === 'object' && response !== null && 'message' in response) {
      message = (response as any).message;
    }

    // [Security] Production 환경에서 500 에러 메시지 마스킹
    if (status === HttpStatus.INTERNAL_SERVER_ERROR && process.env.NODE_ENV === 'production') {
      message = 'Internal Server Error';
    }

    return { status, messageCode, message };
  }

  /**
   * 한글 감지 시 Audit Log에 기록
   */
  private async logKoreanDetected(
    request: Request,
    originalMessage: string,
    exception: unknown,
  ): Promise<void> {
    if (!this.dispatchLogService) {
      // DispatchLogService가 주입되지 않은 경우 (초기화 전 등) 로그만 남김
      this.logger.warn(
        `한글 감지됨 (DispatchLogService 미사용): ${request.method} ${request.url} - "${originalMessage}"`,
      );
      return;
    }

    const requestInfo = extractClientInfo(request);
    const userId =
      (request as any).user?.id ||
      (request as any).session?.userId;

    await this.dispatchLogService.dispatch(
      {
        type: LogType.ACTIVITY,
        data: {
          userId: userId ? userId.toString() : undefined,
          category: 'API_RESPONSE',
          action: 'KOREAN_DETECTED',
          country: requestInfo.country,
          city: requestInfo.city,
          isMobile: requestInfo.isMobile,
          cfRay: requestInfo.cfRay,
          metadata: {
            method: request.method,
            url: request.url,
            path: request.path,
            ip: requestInfo.ip,
            userAgent: requestInfo.userAgent,
            originalMessage,
            isAdmin: (request as any).user?.isAdmin || false,
            exceptionName:
              exception instanceof Error
                ? exception.constructor.name
                : 'Unknown',
            exceptionMessage:
              exception instanceof Error
                ? exception.message
                : String(exception),
          },
        },
      },
      requestInfo,
    );
  }

  /**
   * 심각한 에러(시스템 장애, DB 오류 등)를 Audit Log에 기록
   */
  private async dispatchCriticalError(
    request: Request,
    exception: unknown,
    messageCode: MessageCode,
    userMessage: string,
  ): Promise<void> {
    if (!this.dispatchLogService) return;

    // 로깅 과정에서 에러가 나더라도 원본 요청 처리에 영향 주지 않도록 try-catch
    try {
      const requestInfo = extractClientInfo(request);
      const userId =
        (request as any).user?.id ||
        (request as any).session?.userId;

      const errorStack = exception instanceof Error ? exception.stack?.slice(0, 2000) : '';

      const sanitizedBody = request.body;
      const sanitizedQuery = request.query;

      // Prisma 메타데이터 (어떤 컬럼이 문제인지 등)
      const prismaMeta = exception instanceof Prisma.PrismaClientKnownRequestError ? exception.meta : undefined;

      await this.dispatchLogService.dispatch(
        {
          type: LogType.ERROR,
          data: {
            userId: userId ? userId.toString() : undefined,
            errorCode: messageCode,
            errorMessage: userMessage,
            stackTrace: errorStack,
            path: request.path,
            method: request.method,
            severity: 'CRITICAL', // 심각한 에러는 CRITICAL
            country: requestInfo.country,
            city: requestInfo.city,
            isMobile: requestInfo.isMobile,
            cfRay: requestInfo.cfRay,
            ip: requestInfo.ip,
            userAgent: requestInfo.userAgent,
            metadata: {
              url: request.url,
              query: JSON.stringify(sanitizedQuery), // Query String
              body: JSON.stringify(sanitizedBody)?.slice(0, 4000), // Body (너무 길면 자름)
              prismaMeta, // Prisma 상세 에러 정보
              originalError: exception instanceof Error ? exception.message : String(exception),
            },
          },
        },
        requestInfo,
      );
    } catch (e) {
      this.logger.error(`Failed to dispatch critical error log: ${e.message}`);
    }
  }
}
