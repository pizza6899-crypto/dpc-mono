// apps/api/src/modules/notification/inbox/application/delete-notification.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import {
  NotificationLog,
  NotificationLogNotFoundException,
  UnauthorizedNotificationAccessException,
} from '../domain';
import { NOTIFICATION_LOG_REPOSITORY } from '../ports';
import type { NotificationLogRepositoryPort } from '../ports';

interface DeleteNotificationParams {
  receiverId: bigint;
  notificationId: bigint;
  notificationCreatedAt: Date;
}

@Injectable()
export class DeleteNotificationService {
  constructor(
    @Inject(NOTIFICATION_LOG_REPOSITORY)
    private readonly repository: NotificationLogRepositoryPort,
  ) {}

  @Transactional()
  async execute(params: DeleteNotificationParams): Promise<NotificationLog> {
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
      throw new UnauthorizedNotificationAccessException(
        notificationId,
        receiverId,
      );
    }

    // 3. 이미 삭제된 경우 그냥 반환
    if (notification.isDeleted) {
      return notification;
    }

    // 4. 삭제 처리 (Soft Delete)
    notification.markAsDeleted();

    // 5. 저장
    return this.repository.update(notification);
  }
}
