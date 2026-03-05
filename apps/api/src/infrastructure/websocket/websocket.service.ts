import { Injectable } from '@nestjs/common';
import { SOCKET_ROOMS } from './constants/websocket-rooms.constant';
import type { SocketRoomType } from './constants/websocket-rooms.constant';
import { UserWebsocketGateway } from './gateways/user-websocket.gateway';
import { AdminWebsocketGateway } from './gateways/admin-websocket.gateway';
import { SocketEventDto } from './dtos/socket-event.dto';

@Injectable()
export class WebsocketService {
  constructor(
    private readonly gateway: UserWebsocketGateway,
    private readonly adminGateway: AdminWebsocketGateway,
  ) { }

  /** 단일 이벤트 채널 이름 (프론트엔드는 이 이벤트 하나만 리슨) */
  private readonly EVENT_NAME = 'events';

  /**
   * 특정 사용자에게 이벤트를 전송합니다. (개인 룸 대상)
   * 일반 사용자 네임스페이스(/)와 관리자 네임스페이스(/admin) 모두에 이벤트를 발송합니다.
   * @param userId 수신자 사용자 ID
   * @param type 알림의 종류/분류 (단일 이벤트의 payload 식별자)
   * @param payload 실제 데이터 객체
   */
  sendToUser(userId: bigint, type: string, payload: any): void {
    const message = SocketEventDto.create(type, payload);
    this.gateway.emitToUser(userId, this.EVENT_NAME, message);
    this.adminGateway.emitToAdmin(userId, this.EVENT_NAME, message);
  }

  /**
   * 특정 룸에 이벤트를 전송합니다.
   * 유저와 관리자 네임스페이스 모두에 이벤트를 발송하여, 
   * 어느 쪽이든 해당 룸에 참여 중이라면 실시간 이벤트를 수신할 수 있도록 보장합니다.
   * @param room 대상 룸 이름
   * @param type 알림의 종류/분류 (단일 이벤트의 payload 식별자)
   * @param payload 실제 데이터 객체
   */
  sendToRoom(room: SocketRoomType, type: string, payload: any): void {
    const message = SocketEventDto.create(type, payload);
    this.gateway.emitToRoom(room, this.EVENT_NAME, message);
    this.adminGateway.emitToRoom(room, this.EVENT_NAME, message);
  }
}
