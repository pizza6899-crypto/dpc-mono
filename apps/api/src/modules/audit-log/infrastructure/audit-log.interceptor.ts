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
    const clientInfo = request.clientInfo as RequestClientInfo | undefined;
    const args = context.getArgs();

    const user = request.user as AuthenticatedUser | undefined;

    return next.handle().pipe(
      tap((result) => {
        // 성공 시 로그 기록
        if (options.logOnSuccess !== false) {
          this.logSuccess(options, args, result, clientInfo, user);
        }
      }),
      catchError((error) => {
        // 실패 시 로그 기록
        if (options.logOnError !== false) {
          this.logError(options, args, error, clientInfo, user);
        }
        return throwError(() => error);
      }),
    );
  }

  private async logSuccess(
    options: AuditLogOptions,
    args: any[],
    result: any,
    clientInfo?: RequestClientInfo,
    user?: AuthenticatedUser,
  ): Promise<void> {
    const userId = this.extractUserId(args, result, user);
    const metadata = options.extractMetadata?.(args, result);

    const payload = this.buildLogPayload(
      options,
      userId,
      'SUCCESS',
      metadata,
      clientInfo,
      user,
    );

    await this.dispatchLogService.dispatch(payload, clientInfo);
  }

  private async logError(
    options: AuditLogOptions,
    args: any[],
    error: Error,
    clientInfo?: RequestClientInfo,
    user?: AuthenticatedUser,
  ): Promise<void> {
    const userId = this.extractUserId(args, undefined, user);
    const metadata = options.extractMetadata?.(args, undefined, error);

    const payload = this.buildLogPayload(
      options,
      userId,
      'FAILURE',
      {
        ...metadata,
        error: error.message,
        errorName: error.name,
      },
      clientInfo,
      user,
    );

    await this.dispatchLogService.dispatch(payload, clientInfo);
  }

  private extractUserId(
    args: any[],
    result?: any,
    user?: AuthenticatedUser,
  ): string | undefined {
    // 1. req.user가 있으면 우선 사용 (passport 인증 사용자)
    if (user?.id !== undefined) {
      return String(user.id);
    }

    // 2. 기본 추출 로직: 첫 번째 파라미터에서 userId 또는 user.id 찾기
    for (const arg of args) {
      if (typeof arg === 'object' && arg !== null) {
        if (arg.userId !== undefined) {
          return String(arg.userId);
        }
        if (arg.user?.id !== undefined) {
          return String(arg.user.id);
        }
        if (arg.id !== undefined && typeof arg.id === 'bigint') {
          return String(arg.id);
        }
      }
    }

    // 4. result에서 찾기
    if (result && typeof result === 'object') {
      if (result.userId !== undefined) {
        return String(result.userId);
      }
      if (result.id !== undefined) {
        return String(result.id);
      }
    }

    return undefined;
  }

  private buildLogPayload(
    options: AuditLogOptions,
    userId: string | undefined,
    status: string,
    metadata?: Record<string, any>,
    clientInfo?: RequestClientInfo,
    user?: AuthenticatedUser,
  ): LogJobData {
    // 어드민 체크: role이 ADMIN 또는 SUPER_ADMIN이면 isAdmin 추가
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    const enrichedMetadata = {
      ...metadata,
      ...(isAdmin && { isAdmin: true }),
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
          ip: clientInfo?.ip,
          userAgent: clientInfo?.userAgent,
        },
      };
    }

    if (options.type === LogType.INTEGRATION) {
      return {
        type: LogType.INTEGRATION,
        data: {
          userId,
          provider: metadata?.provider || 'UNKNOWN',
          method: metadata?.method || 'UNKNOWN',
          endpoint: metadata?.endpoint || '',
          statusCode: metadata?.statusCode,
          duration: metadata?.duration || 0,
          success: status === 'SUCCESS',
          sessionId: clientInfo?.sessionId,
          country: clientInfo?.country,
          city: clientInfo?.city,
          bot: clientInfo?.bot,
          threat: clientInfo?.threat,
          cfRay: clientInfo?.cfRay,
          ip: clientInfo?.ip,
        },
      };
    }

    // 타입 가드용 (실제로는 도달하지 않음)
    throw new Error(`Unsupported log type: ${options.type}`);
  }
}

