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
  saveAuthLog(id: bigint, payload: AuthLogPayload): Promise<void>;
  saveActivityLog(id: bigint, payload: ActivityLogPayload): Promise<void>;
  saveSystemErrorLog(id: bigint, payload: SystemErrorLogPayload): Promise<void>;
  saveIntegrationLog(id: bigint, payload: IntegrationLogPayload): Promise<void>;
}