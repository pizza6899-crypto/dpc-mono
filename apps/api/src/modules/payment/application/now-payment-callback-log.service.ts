// src/modules/payment/application/now-payment-callback-log.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { nowUtc } from 'src/utils/date.util';

@Injectable()
export class NowPaymentCallbackLogService {
  private readonly logger = new Logger(NowPaymentCallbackLogService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async logCallback(
    requestHeaders: Record<string, any>,
    requestBody: any,
    responseStatus?: number,
    responseBody?: any,
    processingError?: string,
  ) {
    try {
      await this.prismaService.nowPaymentCallbackLog.create({
        data: {
          requestHeaders,
          requestBody,
          responseStatus,
          responseBody,
          processingError,
          processed: !processingError,
          processedAt: !processingError ? nowUtc() : null,
        },
      });
    } catch (error) {
      this.logger.error(error, '콜백 로그 저장 실패');
      // 로그 저장 실패는 콜백 처리에 영향을 주지 않도록 에러를 던지지 않음
    }
  }
}
