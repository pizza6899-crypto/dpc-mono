import { Injectable } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';

@Injectable()
export class SocketService {
    constructor(private readonly gateway: SocketGateway) { }

    /**
     * 특정 사용자에게 이벤트를 전송합니다.
     */
    sendToUser(userId: string | bigint, event: string, data: any): void {
        this.gateway.emitToUser(userId, event, data);
    }

    /**
     * 특정 룸에 이벤트를 전송합니다.
     */
    sendToRoom(room: string, event: string, data: any): void {
        this.gateway.emitToRoom(room, event, data);
    }

    /**
     * 전체 사용자에게 이벤트를 전송합니다.
     */
    broadcast(event: string, data: any): void {
        this.gateway.emitToAll(event, data);
    }
}
