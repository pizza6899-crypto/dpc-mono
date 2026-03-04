import { Logger, Injectable } from '@nestjs/common';
import type { SocketRoomType } from './constants/socket-rooms';
import { SocketGateway } from './socket.gateway'; // Assuming SocketGateway is in the same directory or a sibling file

@Injectable()
export class SocketService {
  constructor(private readonly gateway: SocketGateway) { }

  /**
   * 특정 사용자에게 이벤트를 전송합니다.
   */
  sendToUser(userId: bigint, event: string, data: any): void {
    this.gateway.emitToUser(userId, event, data);
  }

  /**
   * 특정 룸에 이벤트를 전송합니다.
   */
  sendToRoom(room: SocketRoomType, event: string, data: any): void {
    this.gateway.emitToRoom(room, event, data);
  }

  /**
   * 전체 사용자에게 이벤트를 전송합니다.
   */
  broadcast(event: string, data: any): void {
    this.gateway.emitToAll(event, data);
  }
}
