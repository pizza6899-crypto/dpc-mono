import { Alert, type AlertEvent } from '../domain';

export interface AlertRepositoryPort {
  /**
   * Alert 생성
   */
  create<E extends AlertEvent>(alert: Alert<E>): Promise<Alert<E>>;

  /**
   * 복합키로 조회 (nullable)
   */
  findById(createdAt: Date, id: bigint): Promise<Alert | null>;

  /**
   * 복합키로 조회 (예외 발생)
   */
  getById(createdAt: Date, id: bigint): Promise<Alert>;

  /**
   * 멱등성 키로 조회 (중복 방지용, 최근 3일 치 데이터 등 검색)
   */
  findByIdempotencyKey(idempotencyKey: string): Promise<Alert | null>;

  /**
   * Alert 업데이트
   */
  update<E extends AlertEvent>(alert: Alert<E>): Promise<Alert<E>>;
}
