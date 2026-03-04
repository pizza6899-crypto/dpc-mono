import { Injectable, Logger } from '@nestjs/common';
import { WebsocketService } from 'src/infrastructure/websocket/websocket.service';
import { SOCKET_ROOMS, SocketRoomType } from 'src/infrastructure/websocket/constants/websocket-rooms.constant';
import { RealtimePayloadMap } from '../../common';

export interface SendRealtimeParams<T extends keyof RealtimePayloadMap> {
  /** 수신 대상 사용자 ID (시스템 내부 표준인 bigint 사용) */
  userId?: bigint;

  /** 특정 룸(채널) 대상 (예: 'admin', 'lobby', 'global') */
  room?: SocketRoomType;

  /** 이벤트명 (REALTIME_EVENTS 상수 사용 권장) */
  event: T;

  /** 전달할 데이터 객체 (이벤트별로 타입이 정의됨) */
  payload: RealtimePayloadMap[T];
}

/**
 * 휘발성 실시간 메시지 발송 서비스
 * DB에 저장하지 않고 소켓을 통해 즉시 전달합니다.
 */
@Injectable()
export class SendRealtimeService {
  private readonly logger = new Logger(SendRealtimeService.name);

  constructor(
    private readonly websocketService: WebsocketService,
  ) { }

  async execute<T extends keyof RealtimePayloadMap>(
    params: SendRealtimeParams<T>,
  ): Promise<void> {
    const { userId, room, event, payload } = params;

    if (userId) {
      // 특정 사용자에게 전송
      this.websocketService.sendToUser(userId, event as string, payload);
      this.logger.debug(`[SendRealtimeService] Emitted ${event as string} to user:${userId}`);
    } else {
      // 특정 룸 또는 전체 브로드캐스트 (room이 없으면 GLOBAL 룸 사용)
      const targetRoom = room || SOCKET_ROOMS.GLOBAL;
      this.websocketService.sendToRoom(targetRoom, event as string, payload);
      this.logger.debug(`[SendRealtimeService] Emitted ${event as string} to room:${targetRoom}`);
    }
  }
}
