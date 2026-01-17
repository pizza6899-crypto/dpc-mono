// apps/api/src/modules/notification/inbox/infrastructure/notification-log.mapper.ts

import { Injectable } from '@nestjs/common';
import { NotificationLog } from '../domain';
import { ChannelType, NotifyStatus, Language } from 'src/generated/prisma';

type PrismaNotificationLog = {
    id: bigint;
    alertId: bigint;
    alertCreatedAt: Date;
    templateId: bigint | null;
    templateEvent: string | null;
    locale: Language | null;
    channel: ChannelType;
    receiverId: bigint;
    target: string | null;
    title: string;
    body: string;
    actionUri: string | null;
    isRead: boolean;
    readAt: Date | null;
    isDeleted: boolean;
    deletedAt: Date | null;
    priority: number;
    scheduledAt: Date;
    status: NotifyStatus;
    errorMessage: string | null;
    sentAt: Date | null;
    retryCount: number;
    metadata: unknown;
    createdAt: Date;
    updatedAt: Date;
};

@Injectable()
export class NotificationLogMapper {
    toDomain(prisma: PrismaNotificationLog): NotificationLog {
        return NotificationLog.fromPersistence({
            id: prisma.id,
            alertId: prisma.alertId,
            alertCreatedAt: prisma.alertCreatedAt,
            templateId: prisma.templateId,
            templateEvent: prisma.templateEvent,
            locale: prisma.locale,
            channel: prisma.channel,
            receiverId: prisma.receiverId,
            target: prisma.target,
            title: prisma.title,
            body: prisma.body,
            actionUri: prisma.actionUri,
            isRead: prisma.isRead,
            readAt: prisma.readAt,
            isDeleted: prisma.isDeleted,
            deletedAt: prisma.deletedAt,
            priority: prisma.priority,
            scheduledAt: prisma.scheduledAt,
            status: prisma.status,
            errorMessage: prisma.errorMessage,
            sentAt: prisma.sentAt,
            retryCount: prisma.retryCount,
            metadata: prisma.metadata as Record<string, unknown> | null,
            createdAt: prisma.createdAt,
            updatedAt: prisma.updatedAt,
        });
    }

    toCreateInput(log: NotificationLog): {
        alertId: bigint;
        alertCreatedAt: Date;
        templateId: bigint | null;
        templateEvent: string | null;
        locale: Language | null;
        channel: ChannelType;
        receiverId: bigint;
        target: string | null;
        title: string;
        body: string;
        actionUri: string | null;
        priority: number;
        scheduledAt: Date;
        status: NotifyStatus;
        metadata: unknown;
    } {
        return {
            alertId: log.alertId,
            alertCreatedAt: log.alertCreatedAt,
            templateId: log.templateId,
            templateEvent: log.templateEvent,
            locale: log.locale,
            channel: log.channel,
            receiverId: log.receiverId,
            target: log.target,
            title: log.title,
            body: log.body,
            actionUri: log.actionUri,
            priority: log.priority,
            scheduledAt: log.scheduledAt,
            status: log.status,
            metadata: log.metadata,
        };
    }

    toUpdateInput(log: NotificationLog): {
        isRead: boolean;
        readAt: Date | null;
        isDeleted: boolean;
        deletedAt: Date | null;
        status: NotifyStatus;
        errorMessage: string | null;
        sentAt: Date | null;
        retryCount: number;
    } {
        return {
            isRead: log.isRead,
            readAt: log.readAt,
            isDeleted: log.isDeleted,
            deletedAt: log.deletedAt,
            status: log.status,
            errorMessage: log.errorMessage,
            sentAt: log.sentAt,
            retryCount: log.retryCount,
        };
    }
}
