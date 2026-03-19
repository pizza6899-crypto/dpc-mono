import { Injectable, forwardRef, Inject } from '@nestjs/common';
import {
  type SocketRoomType,
  getSocketRoom,
} from './constants/websocket-rooms.constant';
import { UserWebsocketGateway } from './gateways/user-websocket.gateway';
import { AdminWebsocketGateway } from './gateways/admin-websocket.gateway';
import { SocketEventDto } from './dtos/socket-event.dto';
import { type SocketPayloadMap } from './types/socket-payload.types';
import { ChatRoomType } from '@prisma/client';
import { OnWebsocketConnectHook } from './interfaces/connection-hook.interface';
import { Socket } from 'socket.io';

@Injectable()
export class WebsocketService {
  private readonly hooks: OnWebsocketConnectHook[] = [];

  constructor(
    @Inject(forwardRef(() => UserWebsocketGateway))
    private readonly gateway: UserWebsocketGateway,
    @Inject(forwardRef(() => AdminWebsocketGateway))
    private readonly adminGateway: AdminWebsocketGateway,
  ) {}

  /**
   * 외부 모듈에서 연결 시 실행할 훅을 등록합니다.
   */
  registerHook(hook: OnWebsocketConnectHook): void {
    this.hooks.push(hook);
  }

  /**
   * 등록된 모든 훅을 실행합니다.
   */
  async executeConnectHooks(
    client: Socket,
    userId: bigint,
    isAdmin: boolean,
  ): Promise<void> {
    await Promise.all(
      this.hooks.map((hook) => hook.onConnect(client, userId, isAdmin)),
    );
  }

  /** 단일 이벤트 채널 이름 (프론트엔드는 이 이벤트 하나만 리슨) */
  private readonly EVENT_NAME = 'events';

  /**
   * 특정 사용자에게 이벤트를 전송합니다. (개인 룸 대상)
   * 일반 사용자 네임스페이스(/)와 관리자 네임스페이스(/admin) 모두에 이벤트를 발송합니다.
   * @param userId 수신자 사용자 ID
   * @param type 이벤트 타입 (SOCKET_EVENT_TYPES 상수 사용)
   * @param payload 해당 타입에 대응하는 페이로드 객체
   */
  sendToUser<T extends keyof SocketPayloadMap>(
    userId: bigint,
    type: T,
    payload: SocketPayloadMap[T],
  ): void {
    const message = SocketEventDto.create(type as string, payload);

    // 1. 관리자에게 전송
    this.adminGateway.emitToAdmin(userId, this.EVENT_NAME, message);

    // 2. 사용자에게 전송
    this.gateway.emitToUser(userId, this.EVENT_NAME, message);
  }

  /**
   * 특정 룸에 이벤트를 전송합니다.
   * 유저와 관리자 네임스페이스 모두에 이벤트를 발송하여,
   * 어느 쪽이든 해당 룸에 참여 중이라면 실시간 이벤트를 수신할 수 있도록 보장합니다.
   * @param room 대상 룸 이름
   * @param type 이벤트 타입 (SOCKET_EVENT_TYPES 상수 사용)
   * @param payload 해당 타입에 대응하는 페이로드 객체
   */
  sendToRoom<T extends keyof SocketPayloadMap>(
    room: SocketRoomType,
    type: T,
    payload: SocketPayloadMap[T],
  ): void {
    const message = SocketEventDto.create(type as string, payload);

    // 1. 관리자 룸에 전송
    this.adminGateway.emitToRoom(room, this.EVENT_NAME, message);

    // 2. 사용자 룸에 전송
    this.gateway.emitToRoom(room, this.EVENT_NAME, message);
  }

  /**
   * 사용자의 모든 소켓 세션을 특정 채팅방/고객응대 룸에 가입시킵니다.
   */
  async joinChatRoom(
    userId: bigint,
    roomId: bigint,
    roomType: ChatRoomType,
  ): Promise<void> {
    const isSupport = roomType === ChatRoomType.SUPPORT;
    const roomName = isSupport
      ? getSocketRoom.support(roomId)
      : getSocketRoom.chat(roomId);

    const userRoom = getSocketRoom.user(userId);
    await this.gateway.server.in(userRoom).socketsJoin(roomName);
  }

  /**
   * 사용자의 모든 소켓 세션을 특정 채팅방/고객응대 룸에서 탈퇴시킵니다.
   */
  async leaveChatRoom(
    userId: bigint,
    roomId: bigint,
    roomType: ChatRoomType,
  ): Promise<void> {
    const isSupport = roomType === ChatRoomType.SUPPORT;
    const roomName = isSupport
      ? getSocketRoom.support(roomId)
      : getSocketRoom.chat(roomId);

    const userRoom = getSocketRoom.user(userId);
    await this.gateway.server.in(userRoom).socketsLeave(roomName);
  }
}
