import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { nowUtc } from 'src/utils/date.util';

@Injectable()
export class WhitecliffLoggingInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = nowUtc().getTime();

    // Whitecliff 관련 요청인지 확인
    if (!this.isWhitecliffRequest(request)) {
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
      externalTxId: this.extractExternalTxId(request.body),
      roundId: this.extractRoundId(request.body),
      sessionId: this.extractSessionId(request.body),
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
          console.error('Whitecliff 로그 저장 실패:', error);
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

  private isWhitecliffRequest(request: any): boolean {
    const url = request.url || '';

    // Whitecliff 전용 콜백 엔드포인트만 허용
    const whitecliffEndpoints = [
      '/dopaminedev/balance',
      '/dopaminedev/debit',
      '/dopaminedev/credit',
      '/dopaminedev/bonus',
    ];

    if (whitecliffEndpoints.includes(url)) {
      return true;
    }

    // ag-code 헤더가 있으면 Whitecliff 요청
    if (request.headers?.['ag-code']) {
      return true;
    }

    return false;
  }

  private extractAction(request: any): string {
    const url = request.url;
    if (url === '/dopaminedev/balance') return 'GET_BALANCE';
    if (url === '/dopaminedev/debit') return 'DEBIT';
    if (url === '/dopaminedev/credit') return 'CREDIT';
    if (url === '/dopaminedev/bonus') return 'GET_BONUS';
    return 'UNKNOWN';
  }

  private extractExternalTxId(body: any): string | undefined {
    return body?.txn_id || body?.txnId;
  }

  private extractRoundId(body: any): string | undefined {
    return body?.round_id || body?.roundId;
  }

  private extractSessionId(body: any): string | undefined {
    return body?.sid || body?.sessionId;
  }

  private extractUserId(body: any): string | undefined {
    return body?.user_id?.toString() || body?.userId?.toString();
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    // 민감 정보 제거
    delete sanitized.authorization;
    delete sanitized['ag-token'];
    return sanitized;
  }

  private async saveLog(logData: any): Promise<void> {
    try {
      await this.prisma.whitecliffApiLog.create({
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
      console.error('Whitecliff 로그 저장 실패:', error);
      // 프로덕션에서는 로그 저장 실패를 더 적극적으로 처리해야 함
    }
  }
}
