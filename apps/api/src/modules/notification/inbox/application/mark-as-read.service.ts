// apps/api/src/modules/notification/inbox/application/mark-as-read.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { NotificationLog, NotificationLogNotFoundException, UnauthorizedNotificationAccessException } from '../domain';
import { NOTIFICATION_LOG_REPOSITORY } from '../ports';
import type { NotificationLogRepositoryPort } from '../ports';

interface MarkAsReadParams {
    receiverId: bigint;
    notificationId: bigint;
    notificationCreatedAt: Date;
}

@Injectable()
export class MarkAsReadService {
    constructor(
        @Inject(NOTIFICATION_LOG_REPOSITORY)
        private readonly repository: NotificationLogRepositoryPort,
    ) { }

    @Transactional()
    async execute(params: MarkAsReadParams): Promise<NotificationLog> {
        const { receiverId, notificationId, notificationCreatedAt } = params;

        // 1. 알림 조회
        const notification = await this.repository.findByIdAndReceiverId(
            notificationCreatedAt,
            notificationId,
            receiverId,
        );

        if (!notification) {
            throw new NotificationLogNotFoundException(notificationId);
        }

        // 2. 권한 체크
        if (!notification.belongsTo(receiverId)) {
            throw new UnauthorizedNotificationAccessException(notificationId, receiverId);
        }

        // 3. 이미 읽은 경우 그냥 반환
        if (notification.isRead) {
            return notification;
        }

        // 4. 읽음 처리
        notification.markAsRead();

        // 5. 저장
        return this.repository.update(notification);
    }
}
