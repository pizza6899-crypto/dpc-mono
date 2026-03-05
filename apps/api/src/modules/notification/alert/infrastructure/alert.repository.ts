// apps/api/src/modules/notification/alert/infrastructure/alert.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { subDays } from 'date-fns';
import { Alert, AlertNotFoundException, type AlertEvent } from '../domain';
import { AlertRepositoryPort } from '../ports';
import { AlertMapper } from './alert.mapper';

@Injectable()
export class AlertRepository implements AlertRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
    private readonly mapper: AlertMapper,
  ) { }

  async create<E extends AlertEvent>(alert: Alert<E>): Promise<Alert<E>> {
    const data = this.mapper.toCreateInput(alert);

    const result = await this.tx.alert.create({
      data,
    });
    return this.mapper.toDomain(result) as Alert<E>;
  }

  async findById(createdAt: Date, id: bigint): Promise<Alert | null> {
    const result = await this.tx.alert.findUnique({
      where: {
        createdAt_id: { createdAt, id },
      },
    });
    return result ? this.mapper.toDomain(result) : null;
  }

  async getById(createdAt: Date, id: bigint): Promise<Alert> {
    const alert = await this.findById(createdAt, id);
    if (!alert) {
      throw new AlertNotFoundException(`${createdAt.toISOString()}:${id}`);
    }
    return alert;
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<Alert | null> {
    // 파티셔닝 환경에서 전체 스캔을 방지하기 위해 최근 1일 내 데이터만 검색
    // (멱등성 보장은 통상적인 재시도 윈도우 내에서만 유효하면 충분함)
    const result = await this.tx.alert.findFirst({
      where: {
        idempotencyKey,
        createdAt: {
          gte: subDays(new Date(), 1),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return result ? this.mapper.toDomain(result) : null;
  }

  async update<E extends AlertEvent>(alert: Alert<E>): Promise<Alert<E>> {
    if (!alert.id) {
      throw new Error('Cannot update alert without id');
    }

    const data = this.mapper.toUpdateInput(alert);
    const result = await this.tx.alert.update({
      where: {
        createdAt_id: { createdAt: alert.createdAt, id: alert.id },
      },
      data,
    });
    return this.mapper.toDomain(result) as Alert<E>;
  }
}
