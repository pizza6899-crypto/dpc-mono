import { SetMetadata } from '@nestjs/common';
import type { LogType } from '../domain';

export const AUDIT_LOG_METADATA = 'auditLog';

export interface AuditLogOptions {
  /** 로그 타입 (필수) */
  type: LogType;
  /** 액션명 (필수) */
  action: string;
  /** 카테고리 (ACTIVITY 로그용, 옵션) */
  category?: string;
  /** 메타데이터 추출 함수 (옵션) */
  extractMetadata?: (
    request: any,
    args: any[],
    result?: any,
    error?: Error,
  ) => Record<string, any> | undefined;
  /** 로그 기록의 주체가 될 사용자 ID (옵션)
   * 지정하지 않으면 현재 로그인한 사용자의 ID를 사용합니다.
   * 함수 형태 전달 시 request, args, result, error를 기반으로 동적 추출이 가능합니다.
   */
  userId?:
    | string
    | bigint
    | ((
        request: any,
        args: any[],
        result?: any,
        error?: Error,
      ) => string | bigint | undefined);
  /** 성공 시 로그 기록 여부 (기본값: true) */
  logOnSuccess?: boolean;
  /** 실패 시 로그 기록 여부 (기본값: true) */
  logOnError?: boolean;
}

/**
 * Audit Log 데코레이터
 *
 * 메서드에 이 데코레이터를 붙이면 자동으로 audit log가 기록됩니다.
 *
 * @important 컨트롤러 메서드에만 적용 가능합니다.
 * NestJS 인터셉터는 HTTP 핸들러(컨트롤러 메서드)에만 적용되므로,
 * 서비스 메서드에는 적용되지 않습니다.
 *
 * @example
 * ```typescript
 * @Controller('auth')
 * export class AuthController {
 *   @Post('login')
 *   @AuditLog({
 *     type: LogType.AUTH,
 *     action: 'LOGIN',
 *   })
 *   async login(@Body() dto: LoginDto) {
 *     // 로그인 로직
 *   }
 * }
 * ```
 */
export const AuditLog = (options: AuditLogOptions) =>
  SetMetadata(AUDIT_LOG_METADATA, options);
