// apps/api/src/modules/notification/alert/ports/alert.repository.port.ts

import { AlertStatus } from '@repo/database';
import { Alert } from '../domain';

export interface AlertListQuery {
    status?: AlertStatus;
    event?: string;
    userId?: bigint;
    startDate?: Date;
    endDate?: Date;
    skip?: number;
    take?: number;
}

export interface AlertRepositoryPort {
    /**
     * Alert 생성
     */
    create(alert: Alert): Promise<Alert>;

    /**
     * 복합키로 조회 (nullable)
     */
    findById(createdAt: Date, id: bigint): Promise<Alert | null>;

    /**
     * 복합키로 조회 (예외 발생)
     */
    getById(createdAt: Date, id: bigint): Promise<Alert>;

    /**
     * 멱등성 키로 조회
     */
    findByIdempotencyKey(
        idempotencyKey: string,
        createdAt: Date,
    ): Promise<Alert | null>;

    /**
     * Alert 업데이트
     */
    update(alert: Alert): Promise<Alert>;

    /**
     * PENDING 상태 Alert 목록 조회 (팬아웃 대기)
     */
    listPending(limit: number): Promise<Alert[]>;

    /**
     * Alert 목록 조회 (Admin)
     */
    list(query: AlertListQuery): Promise<{ items: Alert[]; total: number }>;
}
