// apps/api/src/modules/notification/inbox/application/find-notifications.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { ChannelType } from '@prisma/client';
import { NotificationLog } from '../domain';
import { NOTIFICATION_LOG_REPOSITORY } from '../ports';
import type { NotificationLogRepositoryPort } from '../ports';

interface FindNotificationsParams {
    receiverId: bigint;
    channel?: ChannelType;
    isRead?: boolean;
    cursor?: bigint;
    limit?: number;
}

@Injectable()
export class FindNotificationsService {
    constructor(
        @Inject(NOTIFICATION_LOG_REPOSITORY)
        private readonly repository: NotificationLogRepositoryPort,
    ) { }

    async execute(params: FindNotificationsParams): Promise<NotificationLog[]> {
        const { receiverId, channel, isRead, cursor, limit } = params;

        return this.repository.listByReceiverId({
            receiverId,
            channel: channel ?? ChannelType.IN_APP,
            isRead,
            cursor,
            limit,
        });
    }
}
