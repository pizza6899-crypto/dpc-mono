// apps/api/src/modules/notification/inbox/application/get-unread-count.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { ChannelType } from '@prisma/client';
import { NOTIFICATION_LOG_REPOSITORY } from '../ports';
import type { NotificationLogRepositoryPort } from '../ports';

interface GetUnreadCountParams {
  receiverId: bigint;
  channel?: ChannelType;
}

@Injectable()
export class GetUnreadCountService {
  constructor(
    @Inject(NOTIFICATION_LOG_REPOSITORY)
    private readonly repository: NotificationLogRepositoryPort,
  ) {}

  async execute(params: GetUnreadCountParams): Promise<number> {
    const { receiverId, channel } = params;

    return this.repository.countUnread(
      receiverId,
      channel ?? ChannelType.IN_APP,
    );
  }
}
