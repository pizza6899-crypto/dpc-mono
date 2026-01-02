import { SetMetadata } from '@nestjs/common';
import { LogType } from '../domain';

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
    args: any[],
    result?: any,
    error?: Error,
  ) => Record<string, any> | undefined;
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
 * @example
 * ```typescript
 * @AuditLog({
 *   type: LogType.AUTH,
 *   action: 'LOGIN',
 * })
 * async execute({ user, clientInfo }: LoginParams): Promise<void> {
 *   // 로그인 로직
 * }
 * ```
 */
export const AuditLog = (options: AuditLogOptions) =>
  SetMetadata(AUDIT_LOG_METADATA, options);

