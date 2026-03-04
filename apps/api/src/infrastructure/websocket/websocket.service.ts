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
   * 특정 사용자에게 이벤트를 전송합니다. (일반 유저 네임스페이스: /)
   */
  sendToUser(userId: bigint, event: string, data: any): void {
    this.gateway.emitToUser(userId, event, data);
  }

  /**
   * 특정 관리자에게 이벤트를 전송합니다. (관리자 네임스페이스: /admin)
   */
  sendToAdmin(adminId: bigint, event: string, data: any): void {
    this.adminGateway.emitToAdmin(adminId, event, data);
  }

  /**
   * 특정 룸에 이벤트를 전송합니다.
   * 관리자 전용 룸(admin)일 경우 어드민 게이트웨이로만 전송합니다.
   * 그 외의 룸일 경우 일반 유저 게이트웨이로 전송합니다.
   */
  sendToRoom(room: SocketRoomType, event: string, data: any): void {
    if (room === SOCKET_ROOMS.ADMIN) {
      this.adminGateway.emitToAdminRoom(event, data);
    } else {
      this.gateway.emitToRoom(room, event, data);
    }
  }

  /**
   * 유저 네임스페이스와 관리자 네임스페이스 모두에 존재하는 동일한 룸에 메시지를 발송합니다.
   * (예: 1:1 고객센터 채팅방 등 유저와 관리자가 동시에 참여해야 하는 방)
   */
  sendToCrossNamespaceRoom(room: string, event: string, data: any): void {
    this.gateway.emitToRoom(room as SocketRoomType, event, data);
    this.adminGateway.emitToRoom(room as SocketRoomType, event, data);
  }

  /**
   * 전체 사용자에게 이벤트를 전송합니다.
   */
  broadcast(event: string, data: any): void {
    this.gateway.emitToAll(event, data);
  }
}
