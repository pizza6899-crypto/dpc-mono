import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Socket } from 'socket.io';
import { MessageCode } from 'src/common/http/types/message-codes';
import { ExceptionResponseDto } from './dtos/exception-response.dto';
import { Prisma } from '@prisma/client';
import { DomainException } from 'src/common/exception/domain.exception';
import { ApiException } from 'src/common/http/exception/api.exception';

interface ErrorDetails {
  status: number;
  messageCode: MessageCode;
  message: string[];
  exceptionName: string;
}

@Catch()
export class WebsocketExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(WebsocketExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    const data = host.switchToWs().getData();

    // data.event가 있으면 사용, 없으면 pattern 폴백, 둘 다 없으면 'unknown'
    const originalEvent =
      data?.event || host.switchToWs().getPattern() || 'unknown';

    const { status, messageCode, message, exceptionName } =
      this.resolveErrorDetails(exception);

    // 로그 기록
    this.logger.error(
      `WS [${originalEvent}] - ${status} - ${messageCode} - ${message[0]}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const errorResponse = ExceptionResponseDto.from(
      status,
      messageCode,
      exceptionName,
      message,
      originalEvent,
    );

    client.emit('exception', errorResponse);
  }

  private resolveErrorDetails(exception: unknown): ErrorDetails {
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let messageCode = MessageCode.INTERNAL_SERVER_ERROR;
    let message: string[] = ['Internal Server Error'];
    let exceptionName = 'UnknownException';

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const details = this.handlePrismaError(exception);
      return {
        ...details,
        message: [details.message],
        exceptionName: 'PrismaError',
      };
    }

    if (exception instanceof ApiException) {
      return {
        status: exception.getStatus(),
        messageCode: exception.messageCode,
        message: [exception.message],
        exceptionName: exception.name,
      };
    }

    if (exception instanceof DomainException) {
      return {
        status: exception.httpStatus,
        messageCode: exception.errorCode,
        message: [exception.message],
        exceptionName: exception.constructor.name,
      };
    }

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      exceptionName = exception.name;
      const resp = exception.getResponse();

      if (typeof resp === 'object' && resp !== null) {
        const respAny = resp as any;
        // Validation 에러 처리 (배열인 경우)
        if (Array.isArray(respAny.message)) {
          messageCode = MessageCode.VALIDATION_ERROR;
          message = respAny.message;
        } else {
          message = [respAny.message || exception.message];
          // 상태 코드에 따른 메시지 코드 매핑
          messageCode = this.mapStatusToMessageCode(status);
        }
      } else {
        message = [typeof resp === 'string' ? resp : exception.message];
        messageCode = this.mapStatusToMessageCode(status);
      }

      return { status, messageCode, message, exceptionName };
    }

    if (exception instanceof Error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        messageCode: MessageCode.INTERNAL_SERVER_ERROR,
        message: [exception.message],
        exceptionName: exception.name,
      };
    }

    return { status, messageCode, message, exceptionName };
  }

  private handlePrismaError(error: Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return {
          status: HttpStatus.BAD_REQUEST,
          messageCode: MessageCode.DB_CONSTRAINT_VIOLATION,
          message: 'Unique constraint violation',
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          messageCode: MessageCode.USER_NOT_FOUND,
          message: 'Record not found',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          messageCode: MessageCode.DB_QUERY_ERROR,
          message: 'Database request failed',
        };
    }
  }

  private mapStatusToMessageCode(status: number): MessageCode {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return MessageCode.AUTH_INVALID_TOKEN;
      case HttpStatus.FORBIDDEN:
        return MessageCode.AUTH_TOKEN_EXPIRED;
      case HttpStatus.NOT_FOUND:
        return MessageCode.USER_NOT_FOUND;
      case HttpStatus.BAD_REQUEST:
        return MessageCode.VALIDATION_ERROR;
      default:
        return MessageCode.INTERNAL_SERVER_ERROR;
    }
  }
}
