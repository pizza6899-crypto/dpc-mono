import { HttpException } from '@nestjs/common';
import type { MessageCode } from '../types/message-codes';

export class ApiException extends HttpException {
  constructor(
    public readonly messageCode: MessageCode,
    status: number,
    message?: string,
  ) {
    super(message || 'API Error', status);
  }
}
