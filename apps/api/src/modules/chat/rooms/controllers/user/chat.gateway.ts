import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { GetChatRoomService } from '../../application/get-chat-room.service';
import { getSocketRoom } from 'src/infrastructure/websocket/constants/websocket-rooms.constant';
import { ChatRoomType } from '@prisma/client';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { corsConfig } from 'src/common/security/cors.config';

@WebSocketGateway({
    namespace: '/',
    cors: {
        origin: corsConfig.origin,
        credentials: true,
    },
})
export class ChatGateway {
    private readonly logger = new Logger(ChatGateway.name);

    constructor(
        private readonly sqidsService: SqidsService,
        private readonly getRoomService: GetChatRoomService,
    ) { }

    @SubscribeMessage('chat:subscribe')
    async handleSubscribe(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string },
    ) {
        try {
            const { id: roomId } = this.sqidsService.decodeAuto(data.roomId);
            const room = await this.getRoomService.execute({ id: roomId });

            const prefix = room.type === ChatRoomType.SUPPORT ? 'sr' : 'cr';
            const encodedId = this.sqidsService.encode(roomId, prefix as any);
            const roomName = room.type === ChatRoomType.SUPPORT
                ? getSocketRoom.supportRoom(encodedId)
                : getSocketRoom.chatRoom(encodedId);

            client.join(roomName);
            this.logger.debug(`Client ${client.id} subscribed to ${roomName}`);

            return { success: true, roomName };
        } catch (error) {
            this.logger.error(`Failed to subscribe: ${error.message}`);
            return { success: false, message: error.message };
        }
    }

    @SubscribeMessage('chat:unsubscribe')
    async handleUnsubscribe(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string },
    ) {
        try {
            const { id: roomId } = this.sqidsService.decodeAuto(data.roomId);
            const room = await this.getRoomService.execute({ id: roomId });

            const prefix = room.type === ChatRoomType.SUPPORT ? 'sr' : 'cr';
            const encodedId = this.sqidsService.encode(roomId, prefix as any);
            const roomName = room.type === ChatRoomType.SUPPORT
                ? getSocketRoom.supportRoom(encodedId)
                : getSocketRoom.chatRoom(encodedId);

            client.leave(roomName);
            this.logger.debug(`Client ${client.id} unsubscribed from ${roomName}`);

            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}
