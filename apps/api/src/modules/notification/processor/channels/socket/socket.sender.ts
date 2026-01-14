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

    /**
     * DB 저장 없이 특정 사용자에게 실시간 이벤트를 직접 전송합니다.
     */
    async sendDirect(userId: string | bigint, event: string, data: any): Promise<void> {
        this.socketService.sendToUser(userId, event, data);
    }

    /**
     * 특정 룸에 실시간 이벤트를 전송합니다.
     */
    async sendToRoom(room: string, event: string, data: any): Promise<void> {
        this.socketService.sendToRoom(room, event, data);
    }

    /**
     * 모든 접속자에게 이벤트를 브로드캐스트합니다.
     */
    async broadcast(event: string, data: any): Promise<void> {
        this.socketService.broadcast(event, data);
    }
}
