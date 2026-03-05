import { Injectable } from '@nestjs/common';
import { ChannelType } from '@prisma/client';
import { ChannelSender, ChannelSendParams } from '../../../common';
import { WebsocketService } from 'src/infrastructure/websocket/websocket.service';
import { SocketRoomType } from 'src/infrastructure/websocket/constants/websocket-rooms.constant';
import type {
  SocketNotificationNewPayload,
  SocketNotificationVolatilePayload,
  NotificationPayloadMap,
} from '../../../common/types/notification-payload.types';

@Injectable()
export class SocketSender implements ChannelSender {
  constructor(private readonly websocketService: WebsocketService) { }

  getChannelType(): ChannelType {
    return ChannelType.WEBSOCKET;
  }

  async send(params: ChannelSendParams): Promise<void> {
    const payload: SocketNotificationNewPayload = {
      id: params.logId.toString(),
      createdAt: params.logCreatedAt.toISOString(),
      title: params.title,
      body: params.body,
      actionUri: params.actionUri,
      metadata: params.metadata,
    };

    this.websocketService.sendToUser(params.receiverId, 'notification:new', payload);
  }

  /**
   * DB에 기록되지 않는 휘발성 알림 전송 (notification:volatile)
   */
  async sendVolatile<T extends keyof NotificationPayloadMap>(
    type: T,
    data: NotificationPayloadMap[T] & { alertId?: string },
    target: { userId?: bigint; room?: SocketRoomType }
  ): Promise<void> {
    const payload: SocketNotificationVolatilePayload<T> = {
      type,
      data,
    };

    if (target.userId) {
      this.websocketService.sendToUser(target.userId, 'notification:volatile', payload);
    } else if (target.room) {
      this.websocketService.sendToRoom(target.room, 'notification:volatile', payload);
    }
  }
}
