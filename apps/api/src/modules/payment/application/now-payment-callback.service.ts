import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PaymentCallbackDto } from '../dtos/now-payment-callback.dto';
import { EnvService } from 'src/common/env/env.service';
import { NowPaymentCallbackLogService } from './now-payment-callback-log.service';

@Injectable()
export class NowPaymentCallbackService {
  private readonly logger = new Logger(NowPaymentCallbackService.name);

  constructor(
    private readonly envService: EnvService,
    private readonly callbackLogService: NowPaymentCallbackLogService,
  ) { }

  /**
   * NowPayment 콜백 서명 검증
   * @param payload 원본 페이로드 (이미 정렬된 JSON 문자열)
   * @param signature 수신된 서명
   * @returns 검증 결과
   */
  validateSignature(payload: string, signature: string): boolean {
    try {
      const secretKey = this.envService.nowPayment.ipnSecretKey;
      const expectedSignature = crypto
        .createHmac('sha512', secretKey)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex'),
      );
    } catch (error) {
      this.logger.error(error, '서명 검증 중 오류 발생');
      return false;
    }
  }

  /**
   * NowPayment 콜백 처리 (타입별 분기)
   * @param callbackData 콜백 데이터
   * @returns 처리 결과
   */
  async handleCallback(
    callbackData: PaymentCallbackDto,
    requestHeaders: Record<string, any>,
  ): Promise<{ status: 'ok' | 'error'; message?: string }> {
    let processingError: string | undefined;

    try {
      const paymentStatus = callbackData.payment_status;

      let result: { status: 'ok' | 'error'; message?: string };

      switch (paymentStatus) {
        case 'waiting':
          result = { status: 'ok', message: 'Payment waiting' };
          break;
        case 'sending':
          result = { status: 'ok', message: 'Payment sending' };
          break;
        case 'partially_paid':
          result = { status: 'ok', message: 'Payment partially paid' };
          break;
        case 'refunded':
          result = { status: 'ok', message: 'Payment refunded' };
          break;
        case 'expired':
          result = { status: 'ok', message: 'Payment expired' };
          break;
        case 'failed':
          result = { status: 'error', message: 'Payment failed' };
          break;
        case 'finished':
          result = { status: 'ok', message: 'Payment finished' };
          break;
        default:
          result = { status: 'error', message: 'Unknown payment status' };
          break;
      }

      // 콜백 로그 저장 (성공)
      await this.callbackLogService.logCallback(
        requestHeaders,
        callbackData,
        200,
        result,
      );

      return result;
    } catch (error) {
      processingError = error.message;
      await this.callbackLogService.logCallback(
        requestHeaders,
        callbackData,
        500,
        { status: 'error', message: processingError },
        processingError,
      );

      return { status: 'error', message: 'Internal server error' };
    }
  }
}
