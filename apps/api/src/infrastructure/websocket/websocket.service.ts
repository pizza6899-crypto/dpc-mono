import { Injectable } from '@nestjs/common';
import { SOCKET_ROOMS } from './constants/websocket-rooms.constant';
import type { SocketRoomType } from './constants/websocket-rooms.constant';
import { UserWebsocketGateway } from './gateways/user-websocket.gateway';
import { AdminWebsocketGateway } from './gateways/admin-websocket.gateway';

@Injectable()
export class WebsocketService {
  constructor(
    private readonly gateway: UserWebsocketGateway,
    private readonly adminGateway: AdminWebsocketGateway,
  ) { }

  /**
   * 특정 사용자에게 이벤트를 전송합니다. (개인 룸 대상)
   * 일반 사용자 네임스페이스(/)와 관리자 네임스페이스(/admin) 모두에 이벤트를 발송합니다.
   */
  sendToUser(userId: bigint, event: string, data: any): void {
    this.gateway.emitToUser(userId, event, data);
    this.adminGateway.emitToAdmin(userId, event, data);
  }

  /**
   * 특정 룸에 이벤트를 전송합니다.
   * 유저와 관리자 네임스페이스 모두에 이벤트를 발송하여, 
   * 어느 쪽이든 해당 룸에 참여 중이라면 실시간 이벤트를 수신할 수 있도록 보장합니다.
   */
  sendToRoom(room: SocketRoomType, event: string, data: any): void {
    this.gateway.emitToRoom(room, event, data);
    this.adminGateway.emitToRoom(room, event, data);
  }
}
