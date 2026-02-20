import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import type { Request } from 'express';
import { DispatchLogService } from '../application/dispatch-log.service';
import {
  AUDIT_LOG_METADATA,
  type AuditLogOptions,
} from './audit-log.decorator';
import { LogType, type LogJobData } from '../domain';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';

/**
 * Audit Log 인터셉터
 *
 * @AuditLog() 데코레이터가 붙은 메서드의 실행 결과를 자동으로 audit log로 기록합니다.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly dispatchLogService: DispatchLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const options = this.reflector.getAllAndOverride<AuditLogOptions>(
      AUDIT_LOG_METADATA,
      [context.getHandler(), context.getClass()],
    );

    // 데코레이터가 없으면 통과
    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const args = context.getArgs();

    // clientInfo 추출: request.clientInfo 또는 args에서 찾기
    const clientInfo = this.extractClientInfo(request, args);
    const user = request.user as AuthenticatedUser | undefined;

    const startTime = Date.now();
    return next.handle().pipe(
      tap((result) => {
        const duration = Date.now() - startTime;
        // 성공 시 로그 기록
        if (options.logOnSuccess !== false) {
          this.logSuccess(
            options,
            request,
            args,
            result,
            duration,
            clientInfo,
            user,
          );
        }
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        // 실패 시 로그 기록
        if (options.logOnError !== false) {
          this.logError(
            options,
            request,
            args,
            error,
            duration,
            clientInfo,
            user,
          );
        }
        return throwError(() => error);
      }),
    );
  }

  private async logSuccess(
    options: AuditLogOptions,
    request: Request,
    args: any[],
    result: any,
    duration: number,
    clientInfo?: RequestClientInfo,
    user?: AuthenticatedUser,
  ): Promise<void> {
    const userId = this.extractUserId(
      options,
      request,
      args,
      result,
      undefined,
      user,
    );
    const metadata = options.extractMetadata?.(request, args, result);

    const payload = this.buildLogPayload(
      options,
      userId,
      'SUCCESS',
      metadata,
      duration,
      clientInfo,
      user,
    );

    await this.dispatchLogService.dispatch(payload, clientInfo);
  }

  private async logError(
    options: AuditLogOptions,
    request: Request,
    args: any[],
    error: Error,
    duration: number,
    clientInfo?: RequestClientInfo,
    user?: AuthenticatedUser,
  ): Promise<void> {
    const userId = this.extractUserId(
      options,
      request,
      args,
      undefined,
      error,
      user,
    );
    const metadata = options.extractMetadata?.(request, args, undefined, error);

    const payload = this.buildLogPayload(
      options,
      userId,
      'FAILURE',
      {
        ...metadata,
        error: error.message,
        errorName: error.name,
      },
      duration,
      clientInfo,
      user,
    );

    await this.dispatchLogService.dispatch(payload, clientInfo);
  }

  private extractClientInfo(
    request: Request,
    args: any[],
  ): RequestClientInfo | undefined {
    let clientInfo: RequestClientInfo | undefined;

    // 1. request.clientInfo가 있으면 우선 사용
    if (request.clientInfo) {
      clientInfo = request.clientInfo;
    } else {
      // 2. args에서 clientInfo 또는 requestInfo 찾기
      for (const arg of args) {
        if (typeof arg === 'object' && arg !== null) {
          if (arg.clientInfo && typeof arg.clientInfo === 'object') {
            clientInfo = arg.clientInfo as RequestClientInfo;
            break;
          }
          if (arg.requestInfo && typeof arg.requestInfo === 'object') {
            clientInfo = arg.requestInfo as RequestClientInfo;
            break;
          }
        }
      }
    }

    // 3. clientInfo가 있지만 sessionId가 없으면 request.sessionID 보완
    if (clientInfo && !clientInfo.sessionId && request.sessionID) {
      clientInfo = {
        ...clientInfo,
        sessionId: request.sessionID,
      };
    }

    return clientInfo;
  }

  private extractUserId(
    options: AuditLogOptions,
    request: Request,
    args: any[],
    result?: any,
    error?: Error,
    user?: AuthenticatedUser,
  ): string | undefined {
    // 1. 데코레이터에서 userId가 명시된 경우 (우선순위 1)
    if (options.userId) {
      if (typeof options.userId === 'function') {
        const extracted = options.userId(request, args, result, error);
        if (extracted !== undefined) return String(extracted);
      } else {
        return String(options.userId);
      }
    }

    // 2. 결과물(result)에서 userId, id 찾기 (우선순위 2)
    // 성공 시 비즈니스 로직이 반환한 대상 유저 ID를 신뢰함
    if (result && typeof result === 'object') {
      if (result.userId !== undefined) return String(result.userId);
      // User 엔티티나 DTO에서 id가 있고 role이 있다면 유저로 간주
      if (
        result.id !== undefined &&
        (result.role !== undefined || result.email !== undefined)
      ) {
        return String(result.id);
      }
    }

    // 3. 요청(request) 객체에서 대상 유저 ID 탐색 (우선순위 3)
    // params -> body -> query 순서로 탐색
    const searchTargets = [request.params, request.body, request.query];
    for (const target of searchTargets) {
      if (!target) continue;
      if (target.userId !== undefined) return String(target.userId);
      // 'id'는 모호할 수 있으므로 'userId'라는 이름이 없을 때만 차선책으로 사용
    }

    // 4. 요청 파라미터 중 명시적인 'userId' 경로 변수가 있는 경우 처리
    if (request.params?.userId) return String(request.params.userId);

    // 5. req.user (수행자 본인) - 최후의 수단 (우선순위 4)
    if (user?.id !== undefined) {
      return String(user.id);
    }

    return undefined;
  }

  private buildLogPayload(
    options: AuditLogOptions,
    userId: string | undefined,
    status: string,
    metadata?: Record<string, any>,
    duration: number = 0,
    clientInfo?: RequestClientInfo,
    user?: AuthenticatedUser,
  ): LogJobData {
    // 어드민 체크: role이 ADMIN 또는 SUPER_ADMIN이면 isAdmin 추가
    const isAdminFromUser =
      user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    // 실제 수행자와 로그 대상자가 다른 경우 (예: 어드민이 유저 액션 수행), actorId 기록
    const performerId = user?.id ? String(user.id) : undefined;
    const isActorDifferent =
      performerId !== undefined &&
      userId !== undefined &&
      performerId !== userId;

    const enrichedMetadata = {
      ...metadata,
      ...(isAdminFromUser && !metadata?.isAdmin && { isAdmin: true }),
      ...(isActorDifferent && { actorId: performerId, actorRole: user?.role }),
    };
    if (options.type === LogType.AUTH) {
      return {
        type: LogType.AUTH,
        data: {
          userId,
          action: options.action,
          status,
          ip: clientInfo?.ip,
          userAgent: clientInfo?.userAgent,
          deviceFingerprint: clientInfo?.fingerprint,
          country: clientInfo?.country,
          city: clientInfo?.city,
          bot: clientInfo?.bot,
          threat: clientInfo?.threat,
          isMobile: clientInfo?.isMobile,
          cfRay: clientInfo?.cfRay,
          traceId: clientInfo?.traceId,
          sessionId: clientInfo?.sessionId,
          metadata: enrichedMetadata,
        },
      };
    }

    if (options.type === LogType.ACTIVITY) {
      return {
        type: LogType.ACTIVITY,
        data: {
          userId,
          category: options.category || 'GENERAL',
          action: options.action,
          sessionId: clientInfo?.sessionId,
          country: clientInfo?.country,
          city: clientInfo?.city,
          isMobile: clientInfo?.isMobile,
          cfRay: clientInfo?.cfRay,
          traceId: clientInfo?.traceId,
          ip: clientInfo?.ip,
          metadata: enrichedMetadata,
        },
      };
    }

    if (options.type === LogType.ERROR) {
      return {
        type: LogType.ERROR,
        data: {
          userId,
          errorMessage: metadata?.error || 'Unknown error',
          errorCode: metadata?.errorCode,
          stackTrace: metadata?.stackTrace,
          path: clientInfo?.path,
          method: clientInfo?.method,
          severity: metadata?.severity || 'ERROR',
          sessionId: clientInfo?.sessionId,
          country: clientInfo?.country,
          city: clientInfo?.city,
          bot: clientInfo?.bot,
          threat: clientInfo?.threat,
          isMobile: clientInfo?.isMobile,
          cfRay: clientInfo?.cfRay,
          traceId: clientInfo?.traceId,
          ip: clientInfo?.ip,
          userAgent: clientInfo?.userAgent,
        },
      };
    }

    if (options.type === LogType.INTEGRATION) {
      const { request, response, ...restMetadata } = metadata || {};
      return {
        type: LogType.INTEGRATION,
        data: {
          userId,
          provider: metadata?.provider || 'UNKNOWN',
          method: metadata?.method || 'UNKNOWN',
          endpoint: metadata?.endpoint || '',
          statusCode: metadata?.statusCode,
          duration,
          success: status === 'SUCCESS',
          sessionId: clientInfo?.sessionId,
          country: clientInfo?.country,
          city: clientInfo?.city,
          bot: clientInfo?.bot,
          threat: clientInfo?.threat,
          cfRay: clientInfo?.cfRay,
          traceId: clientInfo?.traceId,
          ip: clientInfo?.ip,
          request,
          response,
          metadata: restMetadata,
        },
      };
    }

    // 타입 가드용 (실제로는 도달하지 않음)
    throw new Error(`Unsupported log type: ${options.type}`);
  }
}
