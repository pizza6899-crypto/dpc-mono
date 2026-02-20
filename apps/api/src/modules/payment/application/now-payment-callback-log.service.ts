import { Injectable, Logger } from '@nestjs/common';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';

@Injectable()
export class NowPaymentCallbackLogService {
  private readonly logger = new Logger(NowPaymentCallbackLogService.name);

  constructor(private readonly dispatchLogService: DispatchLogService) {}

  async logCallback(
    requestHeaders: Record<string, any>,
    requestBody: any,
    responseStatus?: number,
    responseBody?: any,
    processingError?: string,
  ) {
    try {
      await this.dispatchLogService.dispatch({
        type: LogType.INTEGRATION,
        data: {
          provider: 'NOW_PAYMENT',
          method: 'CALLBACK',
          endpoint: '/payment/callback/now-payment', // 대략적인 엔드포인트 명시
          statusCode: responseStatus,
          request: {
            headers: requestHeaders,
            body: requestBody,
          },
          response: responseBody,
          duration: 0, // 콜백 처리 시간은 이미 지났으므로 0 혹은 추정치
          success: !processingError,
          metadata: {
            processingError,
          },
        },
      });
    } catch (error) {
      this.logger.error(error, '콜백 로그 디스패치 실패');
      // 로그 저장 실패는 콜백 처리에 영향을 주지 않도록 에러를 던지지 않음
    }
  }
}
