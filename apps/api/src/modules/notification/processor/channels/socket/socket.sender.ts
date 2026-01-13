import { Injectable } from '@nestjs/common';
import { ChannelType } from '@repo/database';
import { ChannelSender, ChannelSendParams } from '../../../common';
import { SocketService } from 'src/modules/socket/socket.service';

@Injectable()
export class SocketSender implements ChannelSender {
    constructor(private readonly socketService: SocketService) { }

    getChannelType(): ChannelType {
        return ChannelType.IN_APP;
    }

    async send(params: ChannelSendParams): Promise<void> {
        this.socketService.sendToUser(params.receiverId, 'notification:new', {
            id: params.logId.toString(),
            createdAt: params.logCreatedAt.toISOString(),
            title: params.title,
            body: params.body,
            actionUri: params.actionUri,
            metadata: params.metadata,
        });
    }
}
