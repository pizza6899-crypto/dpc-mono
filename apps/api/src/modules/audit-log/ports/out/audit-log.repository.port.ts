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
  saveAuthLog(
    id: bigint,
    createdAt: Date,
    payload: AuthLogPayload,
  ): Promise<void>;
  saveActivityLog(
    id: bigint,
    createdAt: Date,
    payload: ActivityLogPayload,
  ): Promise<void>;
  saveSystemErrorLog(
    id: bigint,
    createdAt: Date,
    payload: SystemErrorLogPayload,
  ): Promise<void>;
  saveIntegrationLog(
    id: bigint,
    createdAt: Date,
    payload: IntegrationLogPayload,
  ): Promise<void>;
}
