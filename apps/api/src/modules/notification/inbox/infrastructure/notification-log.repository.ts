// apps/api/src/modules/notification/inbox/infrastructure/notification-log.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { ChannelType, NotifyStatus, Prisma } from 'src/generated/prisma';
import { NotificationLog, NotificationLogNotFoundException } from '../domain';
import {
    NotificationLogRepositoryPort,
    NotificationLogListQuery,
} from '../ports';
import { NotificationLogMapper } from './notification-log.mapper';

@Injectable()
export class NotificationLogRepository implements NotificationLogRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: Transaction<TransactionalAdapterPrisma>,
        private readonly mapper: NotificationLogMapper,
    ) { }

    async create(log: NotificationLog): Promise<NotificationLog> {
        const data = this.mapper.toCreateInput(log);
        const result = await this.tx.notificationLog.create({
            data: {
                ...data,
                metadata: (data.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
            },
        });
        return this.mapper.toDomain(result);
    }

    async createMany(logs: NotificationLog[]): Promise<void> {
        const data = logs.map((log) => {
            const input = this.mapper.toCreateInput(log);
            return {
                ...input,
                metadata: (input.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
            };
        });
        await this.tx.notificationLog.createMany({ data });
    }

    async findById(createdAt: Date, id: bigint): Promise<NotificationLog | null> {
        const result = await this.tx.notificationLog.findUnique({
            where: {
                createdAt_id: { createdAt, id },
            },
        });
        return result ? this.mapper.toDomain(result) : null;
    }

    async getById(createdAt: Date, id: bigint): Promise<NotificationLog> {
        const log = await this.findById(createdAt, id);
        if (!log) {
            throw new NotificationLogNotFoundException(`${createdAt.toISOString()}:${id}`);
        }
        return log;
    }

    async findByIdAndReceiverId(
        createdAt: Date,
        id: bigint,
        receiverId: bigint,
    ): Promise<NotificationLog | null> {
        const result = await this.tx.notificationLog.findFirst({
            where: {
                createdAt,
                id,
                receiverId,
            },
        });
        return result ? this.mapper.toDomain(result) : null;
    }

    async update(log: NotificationLog): Promise<NotificationLog> {
        if (!log.id) {
            throw new Error('Cannot update notification log without id');
        }

        const data = this.mapper.toUpdateInput(log);
        const result = await this.tx.notificationLog.update({
            where: {
                createdAt_id: { createdAt: log.createdAt, id: log.id },
            },
            data,
        });
        return this.mapper.toDomain(result);
    }

    async listByReceiverId(query: NotificationLogListQuery): Promise<NotificationLog[]> {
        const { receiverId, channel, isRead, cursor, limit = 20 } = query;

        const where: Record<string, unknown> = {
            receiverId,
            isDeleted: false,
        };

        if (channel) {
            where.channel = channel;
        }
        if (isRead !== undefined) {
            where.isRead = isRead;
        }

        const results = await this.tx.notificationLog.findMany({
            where,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: limit,
            ...(cursor && {
                cursor: {
                    createdAt_id: { createdAt: new Date(), id: cursor }, // Note: cursor needs proper handling
                },
                skip: 1,
            }),
        });

        return results.map((r) => this.mapper.toDomain(r));
    }

    async countUnread(receiverId: bigint, channel: ChannelType): Promise<number> {
        return this.tx.notificationLog.count({
            where: {
                receiverId,
                channel,
                isRead: false,
                isDeleted: false,
            },
        });
    }

    async markAllAsRead(receiverId: bigint, channel: ChannelType): Promise<number> {
        const result = await this.tx.notificationLog.updateMany({
            where: {
                receiverId,
                channel,
                isRead: false,
                isDeleted: false,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
        return result.count;
    }

    async listPendingForSend(limit: number): Promise<NotificationLog[]> {
        const now = new Date();
        const results = await this.tx.notificationLog.findMany({
            where: {
                status: NotifyStatus.PENDING,
                scheduledAt: { lte: now },
            },
            orderBy: [{ priority: 'asc' }, { scheduledAt: 'asc' }],
            take: limit,
        });
        return results.map((r) => this.mapper.toDomain(r));
    }
}
