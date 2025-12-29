import type {
  AuthLogPayload,
  ActivityLogPayload,
  SystemErrorLogPayload,
  IntegrationLogPayload,
} from '../../domain';

/**
 * Audit Log Repository Port
 * DB 쓰기 작업을 추상화하는 포트
 */
export interface AuditLogRepositoryPort {
  saveAuthLog(id: string, payload: AuthLogPayload): Promise<void>;
  saveActivityLog(id: string, payload: ActivityLogPayload): Promise<void>;
  saveSystemErrorLog(id: string, payload: SystemErrorLogPayload): Promise<void>;
  saveIntegrationLog(id: string, payload: IntegrationLogPayload): Promise<void>;
}