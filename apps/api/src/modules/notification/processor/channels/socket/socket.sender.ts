// apps/api/src/modules/notification/processor/channels/socket/socket.sender.ts

import { Injectable } from '@nestjs/common';
import { ChannelType } from '@repo/database';
import { ChannelSender, ChannelSendParams } from '../../../common';
import { NotificationGateway } from '../../../realtime/notification.gateway';

@Injectable()
export class SocketSender implements ChannelSender {
    constructor(private readonly gateway: NotificationGateway) { }

    getChannelType(): ChannelType {
        return ChannelType.IN_APP;
    }

    async send(params: ChannelSendParams): Promise<void> {
        this.gateway.emitNotification(params.receiverId, {
            id: params.logId.toString(),
            createdAt: params.logCreatedAt.toISOString(),
            title: params.title,
            body: params.body,
            actionUri: params.actionUri,
            metadata: params.metadata,
        });
    }
}
