// apps/api/src/modules/notification/alert/infrastructure/alert.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { AlertStatus } from '@repo/database';
import { Alert, AlertNotFoundException } from '../domain';
import { AlertRepositoryPort, AlertListQuery } from '../ports';
import { AlertMapper } from './alert.mapper';

@Injectable()
export class AlertRepository implements AlertRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: Transaction<TransactionalAdapterPrisma>,
        private readonly mapper: AlertMapper,
    ) { }

    async create(alert: Alert): Promise<Alert> {
        const data = this.mapper.toCreateInput(alert);
        const result = await this.tx.alert.create({ data });
        return this.mapper.toDomain(result);
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
        createdAt: Date,
    ): Promise<Alert | null> {
        const result = await this.tx.alert.findUnique({
            where: {
                idempotencyKey_createdAt: { idempotencyKey, createdAt },
            },
        });
        return result ? this.mapper.toDomain(result) : null;
    }

    async update(alert: Alert): Promise<Alert> {
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
        return this.mapper.toDomain(result);
    }

    async listPending(limit: number): Promise<Alert[]> {
        const results = await this.tx.alert.findMany({
            where: { status: AlertStatus.PENDING },
            orderBy: { createdAt: 'asc' },
            take: limit,
        });
        return results.map((r) => this.mapper.toDomain(r));
    }

    async list(query: AlertListQuery): Promise<{ items: Alert[]; total: number }> {
        const where: Record<string, unknown> = {};

        if (query.status) {
            where.status = query.status;
        }
        if (query.event) {
            where.event = query.event;
        }
        if (query.userId) {
            where.userId = query.userId;
        }
        if (query.startDate || query.endDate) {
            where.createdAt = {
                ...(query.startDate && { gte: query.startDate }),
                ...(query.endDate && { lte: query.endDate }),
            };
        }

        const [items, total] = await Promise.all([
            this.tx.alert.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: query.skip ?? 0,
                take: query.take ?? 20,
            }),
            this.tx.alert.count({ where }),
        ]);

        return {
            items: items.map((item) => this.mapper.toDomain(item)),
            total,
        };
    }
}
