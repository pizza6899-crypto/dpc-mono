// apps/api/src/modules/notification/inbox/application/mark-all-as-read.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ChannelType } from '@prisma/client';
import { NOTIFICATION_LOG_REPOSITORY } from '../ports';
import type { NotificationLogRepositoryPort } from '../ports';

interface MarkAllAsReadParams {
  receiverId: bigint;
  channel?: ChannelType;
}

@Injectable()
export class MarkAllAsReadService {
  constructor(
    @Inject(NOTIFICATION_LOG_REPOSITORY)
    private readonly repository: NotificationLogRepositoryPort,
  ) {}

  @Transactional()
  async execute(params: MarkAllAsReadParams): Promise<number> {
    const { receiverId, channel } = params;

    return this.repository.markAllAsRead(
      receiverId,
      channel ?? ChannelType.INBOX,
    );
  }
}
