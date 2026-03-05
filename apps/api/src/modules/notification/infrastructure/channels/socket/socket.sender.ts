import { Injectable } from '@nestjs/common';
import { ChannelType } from '@prisma/client';
import { ChannelSender, ChannelSendParams } from '../../../common';
import { WebsocketService } from 'src/infrastructure/websocket/websocket.service';

@Injectable()
export class SocketSender implements ChannelSender {
  constructor(private readonly websocketService: WebsocketService) { }

  getChannelType(): ChannelType {
    return ChannelType.INBOX;
  }

  async send(params: ChannelSendParams): Promise<void> {
    this.websocketService.sendToUser(params.receiverId, 'notification:new', {
      id: params.logId.toString(),
      createdAt: params.logCreatedAt.toISOString(),
      title: params.title,
      body: params.body,
      actionUri: params.actionUri,
      metadata: params.metadata,
    });
  }
}
