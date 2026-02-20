import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  PayloadTooLargeException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { FileValidationException } from '../domain/file.exception';
import { MessageCode } from '@repo/shared';

@Catch(PayloadTooLargeException)
export class FileSizeExceptionFilter implements ExceptionFilter {
  catch(exception: PayloadTooLargeException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const domainException = new FileValidationException(
      'File size exceeds the limit.',
      MessageCode.FILE_SIZE_EXCEEDED,
    );

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: domainException.message,
      code: domainException.errorCode,
      timestamp: new Date().toISOString(),
    });
  }
}
