import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Socket } from 'socket.io';

@Catch()
export class WebsocketExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(WebsocketExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    const data = host.switchToWs().getData();

    // data.event가 있으면 사용, 없으면 pattern 폴백, 둘 다 없으면 'unknown'
    const originalEvent =
      data?.event || host.switchToWs().getPattern() || 'unknown';

    let statusCode = 500;
    let errorMessages: string[] = [];
    let exceptionName = 'UnknownException';

    // exception이 null이나 undefined인지 먼저 체크
    if (!exception) {
      exceptionName = 'NullException';
      errorMessages = ['An unknown error occurred'];
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      exceptionName = exception.name; // constructor.name 대신 name 속성 사용
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const response = exceptionResponse as any;

        // Validation 에러인 경우 details에서 메시지 추출
        if (response.details && Array.isArray(response.details)) {
          errorMessages = response.details.map((detail: any) => {
            if (detail?.constraints) {
              const constraintValues = Object.values(detail.constraints);
              return constraintValues.length > 0
                ? (constraintValues[0] as string)
                : 'Validation failed';
            }
            return detail?.message || 'Validation failed';
          });
        } else if (Array.isArray(response.message)) {
          // message가 배열인 경우 (NestJS 기본 ValidationPipe)
          errorMessages = response.message;
        } else {
          // message가 문자열인 경우
          errorMessages = [
            response?.message || exception.message || 'An error occurred',
          ];
        }
      } else {
        errorMessages = [(exceptionResponse as string) || 'An error occurred'];
      }
    } else if (exception instanceof Error) {
      exceptionName = exception.name; // constructor.name 대신 name 속성 사용
      errorMessages = [exception.message || 'An error occurred'];
    } else {
      // 예상치 못한 타입의 exception
      exceptionName =
        typeof exception === 'object' && exception !== null
          ? (exception as any).name || 'UnknownObjectException'
          : 'UnknownException';
      errorMessages = [String(exception) || 'Internal server error'];
    }

    const errorResponse = {
      event: 'exception',
      data: {
        statusCode,
        error: exceptionName,
        message: errorMessages,
        originalEvent,
      },
    };

    client.emit('exception', errorResponse.data);
  }
}
