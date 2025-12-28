import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponseDto } from '../types/response.types';
import { nowUtcIso } from 'src/utils/date.util';
import { MessageCode } from '../types/message-codes';
import { ApiException } from './api.exception';
import { sanitizeApiMessage, hasKorean } from 'src/utils/message.util';
import { ActivityLogPort } from '../../activity-log/activity-log.port';
import { ACTIVITY_LOG } from '../../activity-log/activity-log.token';
import {
  ActivityType,
} from '../../activity-log/activity-log.types';
import { extractClientInfo } from '../utils/request-info.util';
import { Prisma } from '@repo/database';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(
    @Optional()
    @Inject(ACTIVITY_LOG)
    private readonly activityLog: ActivityLogPort | undefined,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let messageCode = MessageCode.INTERNAL_SERVER_ERROR;
    let message = ''; // 옵셔널, 클래스 밸리데이터 및 특정 개발이나 라우팅에서 사용.

    // 🎯 에러 타입별 메시지 코드 매핑
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      status = HttpStatus.BAD_REQUEST;
      const prismaError = exception as Prisma.PrismaClientKnownRequestError;

      switch (prismaError.code) {
        case 'P2002':
          messageCode = MessageCode.DB_CONSTRAINT_VIOLATION;
          break;
        case 'P2025':
          messageCode = MessageCode.USER_NOT_FOUND;
          break;
        default:
          messageCode = MessageCode.DB_QUERY_ERROR;
      }
    } else if (exception instanceof ApiException) {
      status = exception.getStatus();
      messageCode = exception.messageCode;
      message = exception.message;
    } else if (
      exception instanceof Error &&
      exception.constructor.name.includes('AffiliateCode')
    ) {
      // Domain Exception 처리 (AffiliateCode 관련)
      const exceptionName = exception.constructor.name;
      message = exception.message;

      switch (exceptionName) {
        case 'AffiliateCodeLimitExceededException':
          status = HttpStatus.BAD_REQUEST;
          messageCode = MessageCode.AFFILIATE_CODE_LIMIT_EXCEEDED;
          break;
        case 'AffiliateCodeAlreadyExistsException':
          status = HttpStatus.CONFLICT;
          messageCode = MessageCode.AFFILIATE_CODE_ALREADY_EXISTS;
          break;
        case 'AffiliateCodeNotFoundException':
          status = HttpStatus.NOT_FOUND;
          messageCode = MessageCode.AFFILIATE_CODE_NOT_FOUND;
          break;
        case 'AffiliateCodeCannotDeleteException':
          status = HttpStatus.BAD_REQUEST;
          messageCode = MessageCode.AFFILIATE_CODE_CANNOT_DELETE;
          break;
        case 'AffiliateCodeException':
          // 일반적인 AffiliateCodeException (코드 형식 오류 등)
          status = HttpStatus.BAD_REQUEST;
          messageCode = MessageCode.AFFILIATE_CODE_INVALID_FORMAT;
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          messageCode = MessageCode.VALIDATION_ERROR;
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // 🎯 밸리데이션 에러 특별 처리
      // exceptionResponse에 .details 이 있으면 이건 클래스 밸리데이터가 처리한거임.
      if (
        status === HttpStatus.BAD_REQUEST &&
        typeof exceptionResponse === 'object'
      ) {
        const response = exceptionResponse as any;

        if ('details' in response && response.details.length > 0) {
          messageCode = MessageCode.VALIDATION_ERROR;
          message =
            response.details[0].constraints[
              Object.keys(response.details[0].constraints)[0]
            ];
        } else {
          messageCode = MessageCode.VALIDATION_ERROR;
          message = response.message as string;
        }
      } else {
        // HTTP 상태별 메시지 코드 매핑
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
      }
    } else if (exception instanceof Error) {
      messageCode = MessageCode.INTERNAL_SERVER_ERROR;
    }

    // 로그에는 상세 정보 기록 (서버 내부용)
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${exception instanceof Error ? exception.message : 'Unknown error'}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    // 한글 감지 및 로깅
    if (message && hasKorean(message)) {
      this.logKoreanDetected(request, message, exception);
      // 한글 메시지는 빈 문자열로 정제
      message = sanitizeApiMessage(message);
    }

    const errorResponse: ErrorResponseDto = {
      success: false,
      messageCode, // 🎯 메시지 코드만
      message: message,
      timestamp: nowUtcIso(),
      statusCode: status, // HTTP 상태 코드
    };

    response.status(status).json(errorResponse);
  }

  /**
   * 한글 감지 시 DB에 로그 기록
   */
  private async logKoreanDetected(
    request: Request,
    originalMessage: string,
    exception: unknown,
  ): Promise<void> {
    if (!this.activityLog) {
      // ActivityLog가 주입되지 않은 경우 (초기화 전 등) 로그만 남김
      this.logger.warn(
        `한글 감지됨 (ActivityLog 미사용): ${request.method} ${request.url} - "${originalMessage}"`,
      );
      return;
    }

    try {
      const requestInfo = extractClientInfo(request);
      const userId =
        (request as any).user?.id ||
        (request as any).session?.userId ||
        'anonymous';

      await this.activityLog.logFailure(
        {
          userId,
          isAdmin: (request as any).user?.isAdmin || false,
          activityType: ActivityType.KOREAN_DETECTED_IN_API_RESPONSE,
          description: `API 응답 메시지에 한글이 포함되어 있습니다: "${originalMessage}"`,
          metadata: {
            method: request.method,
            url: request.url,
            path: request.path,
            originalMessage,
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
        requestInfo,
      );
    } catch (error) {
      // 로깅 실패는 시스템에 영향을 주지 않도록 조용히 처리
      this.logger.error('한글 감지 로그 저장 실패:', error);
    }
  }

}
