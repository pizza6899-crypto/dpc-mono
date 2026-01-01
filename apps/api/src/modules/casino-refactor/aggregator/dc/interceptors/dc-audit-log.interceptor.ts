import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import { extractClientInfo } from 'src/common/http/utils/request-info.util';
import type { Request } from 'express';

/**
 * DC 콜백 Audit Log 인터셉터
 * 
 * DC 콜백 API의 요청/응답을 audit 통합 로그로 기록합니다.
 * IntegrationLogPayload 형식으로 큐에 디스패치하여 저장합니다.
 */
@Injectable()
export class DcAuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DcAuditLogInterceptor.name);

  constructor(private readonly dispatchLogService: DispatchLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    // DC 콜백 요청인지 확인
    if (!this.isDcCallbackRequest(request)) {
      return next.handle();
    }

    // 클라이언트 정보 추출
    const clientInfo = extractClientInfo(request);

    // 요청 본문에서 userId 추출 (brand_uid)
    const userId = this.extractUserId(request.body);

    // 엔드포인트 정보 추출
    const endpoint = request.path || request.url?.split('?')[0] || '';
    const method = request.method;

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        
        // 비동기 로그 저장을 위해 Promise를 기다리지 않고 백그라운드에서 처리
        this.dispatchLogService
          .dispatch(
            {
              type: LogType.INTEGRATION,
              data: {
                userId,
                sessionId: clientInfo.sessionId,
                provider: 'DC',
                method,
                endpoint,
                statusCode: response.statusCode,
                requestBody: request.body,
                responseBody: data,
                duration,
                success: true,
                country: clientInfo.country,
                city: clientInfo.city,
                bot: clientInfo.bot,
                threat: clientInfo.threat,
                cfRay: clientInfo.cfRay,
                ip: clientInfo.ip,
              },
            },
            clientInfo,
          )
          .catch((error) => {
            this.logger.error('DC audit 로그 저장 실패:', error);
          });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        
        // 비동기 로그 저장을 위해 Promise를 기다리지 않고 백그라운드에서 처리
        this.dispatchLogService
          .dispatch(
            {
              type: LogType.INTEGRATION,
              data: {
                userId,
                sessionId: clientInfo.sessionId,
                provider: 'DC',
                method,
                endpoint,
                statusCode: error.status || 500,
                requestBody: request.body,
                responseBody: { error: error.message },
                duration,
                success: false,
                errorMessage: error.message,
                country: clientInfo.country,
                city: clientInfo.city,
                bot: clientInfo.bot,
                threat: clientInfo.threat,
                cfRay: clientInfo.cfRay,
                ip: clientInfo.ip,
              },
            },
            clientInfo,
          )
          .catch((logError) => {
            this.logger.error('DC audit 에러 로그 저장 실패:', logError);
          });
        
        throw error;
      }),
    );
  }

  private isDcCallbackRequest(request: Request): boolean {
    const url = request.path || request.url?.split('?')[0] || '';

    // DC 콜백 엔드포인트만 허용
    const dcEndpoints = [
      '/dopaminedev/login',
      '/dopaminedev/wager',
      '/dopaminedev/cancelWager',
      '/dopaminedev/appendWager',
      '/dopaminedev/endWager',
      '/dopaminedev/freeSpinResult',
      '/dopaminedev/getBalance',
      '/dopaminedev/promoPayout',
    ];

    return dcEndpoints.includes(url);
  }

  private extractUserId(body: any): string | undefined {
    return body?.brand_uid?.toString();
  }
}

