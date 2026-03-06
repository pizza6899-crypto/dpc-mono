import { Injectable } from '@nestjs/common';
import type { SocketRoomType } from './constants/websocket-rooms.constant';
import { UserWebsocketGateway } from './gateways/user-websocket.gateway';
import { AdminWebsocketGateway } from './gateways/admin-websocket.gateway';
import { SocketEventDto } from './dtos/socket-event.dto';
import type { SocketPayloadMap } from './types/socket-payload.types';
import { SqidsService } from 'src/common/sqids/sqids.service';
import {
  type SqidsPrefixType,
} from 'src/common/sqids/sqids.constants';

@Injectable()
export class WebsocketService {
  constructor(
    private readonly gateway: UserWebsocketGateway,
    private readonly adminGateway: AdminWebsocketGateway,
    private readonly sqidsService: SqidsService,
  ) { }

  /** 단일 이벤트 채널 이름 (프론트엔드는 이 이벤트 하나만 리슨) */
  private readonly EVENT_NAME = 'events';

  /**
   * 특정 사용자에게 이벤트를 전송합니다. (개인 룸 대상)
   * 일반 사용자 네임스페이스(/)와 관리자 네임스페이스(/admin) 모두에 이벤트를 발송합니다.
   * @param userId 수신자 사용자 ID
   * @param type 이벤트 타입 (SOCKET_EVENT_TYPES 상수 사용)
   * @param payload 해당 타입에 대응하는 페이로드 객체
   * @param options 변환 옵션
   */
  sendToUser<T extends keyof SocketPayloadMap>(
    userId: bigint,
    type: T,
    payload: SocketPayloadMap[T],
    options?: { sqidPrefix?: SqidsPrefixType },
  ): void {
    // 1. 관리자에게는 원본(Raw) 전송
    const adminMessage = SocketEventDto.create(type as string, payload);
    this.adminGateway.emitToAdmin(userId, this.EVENT_NAME, adminMessage);

    // 2. 사용자에게는 필요 시 인코딩하여 전송
    const userPayload = this.prepareUserPayload(payload, options?.sqidPrefix);
    const userMessage = SocketEventDto.create(type as string, userPayload);
    this.gateway.emitToUser(userId, this.EVENT_NAME, userMessage);
  }

  /**
   * 특정 룸에 이벤트를 전송합니다.
   * 유저와 관리자 네임스페이스 모두에 이벤트를 발송하여,
   * 어느 쪽이든 해당 룸에 참여 중이라면 실시간 이벤트를 수신할 수 있도록 보장합니다.
   * @param room 대상 룸 이름
   * @param type 이벤트 타입 (SOCKET_EVENT_TYPES 상수 사용)
   * @param payload 해당 타입에 대응하는 페이로드 객체
   * @param options 변환 옵션
   */
  sendToRoom<T extends keyof SocketPayloadMap>(
    room: SocketRoomType,
    type: T,
    payload: SocketPayloadMap[T],
    options?: { sqidPrefix?: SqidsPrefixType },
  ): void {
    // 1. 관리자 룸에는 원본 전송
    const adminMessage = SocketEventDto.create(type as string, payload);
    this.adminGateway.emitToRoom(room, this.EVENT_NAME, adminMessage);

    // 2. 사용자 룸에는 필요 시 인코딩하여 전송
    const userPayload = this.prepareUserPayload(payload, options?.sqidPrefix);
    const userMessage = SocketEventDto.create(type as string, userPayload);
    this.gateway.emitToRoom(room, this.EVENT_NAME, userMessage);
  }

  /**
   * 사용자용 페이로드 준비 (필요 시 ID 인코딩)
   */
  private prepareUserPayload(payload: any, prefix?: SqidsPrefixType): any {
    if (!prefix || !payload || typeof payload !== 'object') {
      return payload;
    }

    // 페이로드에 id 필드가 있고 prefix가 지정된 경우 인코딩 처리
    if ('id' in payload && payload.id) {
      try {
        const rawId =
          typeof payload.id === 'string' ? BigInt(payload.id) : payload.id;
        return {
          ...payload,
          id: this.sqidsService.encode(rawId, prefix),
        };
      } catch (e) {
        // 변환 실패 시 원본 반환
        return payload;
      }
    }

    return payload;
  }

}

