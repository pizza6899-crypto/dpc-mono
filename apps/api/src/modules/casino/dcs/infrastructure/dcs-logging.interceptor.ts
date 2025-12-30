import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { nowUtc } from 'src/utils/date.util';

@Injectable()
export class DcsLoggingInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = nowUtc().getTime();

    // DCS 관련 요청인지 확인
    if (!this.isDcsRequest(request)) {
      return next.handle();
    }

    const logData = {
      action: this.extractAction(request),
      endpoint: request.url,
      httpMethod: request.method,
      request: {
        body: request.body,
        headers: this.sanitizeHeaders(request.headers),
      },
      response: null,
      statusCode: null,
      success: false,
      userId: this.extractUserId(request.body),
    };

    return next.handle().pipe(
      tap((data) => {
        const responseTime = nowUtc().getTime() - startTime;
        // 비동기 로그 저장을 위해 Promise를 기다리지 않고 백그라운드에서 처리
        this.saveLog({
          ...logData,
          response: data,
          statusCode: response.statusCode,
          success: true,
        }).catch((error) => {
          console.error('DCS 로그 저장 실패:', error);
        });
      }),
      catchError((error) => {
        const responseTime = nowUtc().getTime() - startTime;
        // 비동기 로그 저장을 위해 Promise를 기다리지 않고 백그라운드에서 처리
        this.saveLog({
          ...logData,
          response: { error: error.message },
          statusCode: error.status || 500,
          success: false,
        }).catch((logError) => {
          console.error('에러 로그 저장 실패:', logError);
        });
        throw error;
      }),
    );
  }

  private isDcsRequest(request: any): boolean {
    // request.path를 사용하거나, request.url에서 쿼리 스트링 제거
    const url = request.path || request.url?.split('?')[0] || '';

    // DCS 전용 콜백 엔드포인트만 허용
    const dcsEndpoints = [
      '/dopaminedev/login',
      '/dopaminedev/wager',
      '/dopaminedev/cancelWager',
      '/dopaminedev/appendWager',
      '/dopaminedev/endWager',
      '/dopaminedev/freeSpinResult',
      '/dopaminedev/getBalance',
      '/dopaminedev/promoPayout',
    ];

    // 정확한 경로 매칭 (쿼리 스트링 제거된 URL 사용)
    if (dcsEndpoints.includes(url)) {
      return true;
    }

    // x-dcs-request 헤더가 있으면 DCS 요청
    if (request.headers?.['x-dcs-request'] === 'true') {
      return true;
    }

    return false;
  }

  private extractAction(request: any): string {
    const url = request.url;
    if (url.includes('/login')) return 'LOGIN';
    if (url.includes('/wager')) return 'WAGER';
    if (url.includes('/cancelWager')) return 'CANCEL_WAGER';
    if (url.includes('/appendWager')) return 'APPEND_WAGER';
    if (url.includes('/endWager')) return 'END_WAGER';
    if (url.includes('/freeSpinResult')) return 'FREE_SPIN_RESULT';
    if (url.includes('/getBalance')) return 'GET_BALANCE';
    if (url.includes('/promoPayout')) return 'PROMO_PAYOUT';
    return 'UNKNOWN';
  }

  private extractUserId(body: any): string | undefined {
    return body?.brand_uid?.toString();
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    // 민감 정보 제거
    delete sanitized.authorization;
    delete sanitized['x-api-key'];
    return sanitized;
  }

  private async saveLog(logData: any): Promise<void> {
    try {
      await this.prisma.dcsApiLog.create({
        data: {
          action: logData.action,
          endpoint: logData.endpoint,
          httpMethod: logData.httpMethod,
          request: logData.request,
          response: logData.response,
          statusCode: logData.statusCode,
          success: logData.success,
          userId: logData.userId,
        },
      });
    } catch (error) {
      console.error('DCS 로그 저장 실패:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
    }
  }
}
