import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';
import { getSocketRoom, SOCKET_ROOMS } from '../constants/websocket-rooms.constant';
import type { SocketRoomType } from '../constants/websocket-rooms.constant';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { AsyncApiPub } from 'src/common/decorators/async-api.decorator';
import { SocketEventDto } from '../dtos/socket-event.dto';
import { Request } from 'express';
import { CreateSessionService } from 'src/modules/auth/session/application/create-session.service';
import { ExpireSessionService } from 'src/modules/auth/session/application/expire-session.service';
import { SessionType, DeviceInfo } from 'src/modules/auth/session/domain';
import { forwardRef, Inject } from '@nestjs/common';
import { WebsocketService } from '../websocket.service';

import { corsConfig } from 'src/common/security/cors.config';

/**
 * 유저 웹소켓 소켓 확장 인터페이스
 */
interface UserSocket extends Socket {
  user?: AuthenticatedUser;
  request: Request;
}

@WebSocketGateway({
  namespace: '/', // 일반 유저 네임스페이스
  cors: {
    origin: corsConfig.origin,
    credentials: true,
  },
})
@Injectable()
export class UserWebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(UserWebsocketGateway.name);

  constructor(
    private readonly createSessionService: CreateSessionService,
    private readonly expireSessionService: ExpireSessionService,
    @Inject(forwardRef(() => WebsocketService))
    private readonly websocketService: WebsocketService,
  ) { }

  async handleConnection(client: UserSocket) {
    const user = this.extractUser(client);

    // 공통적으로 모든 사용자는 GLOBAL 룸에 자동 가입 (브로드캐스트용)
    client.join(SOCKET_ROOMS.GLOBAL);

    if (user) {
      // 1. 인증된 유저: 유저 고유 룸 조인
      client.join(getSocketRoom.user(user.id));
      this.logger.log(`User connected: ${client.id}, userId: ${user.id}, role: ${user.role}`);

      // 2. DB 세션 생성 (WebSocket 타입)
      const req = client.request;
      client.user = user; // 연결 해제 시 사용하기 위해 유저 정보 보관

      try {
        await this.createSessionService.execute({
          userId: user.id,
          sessionId: client.id,
          parentSessionId: req.sessionID,
          type: SessionType.WEBSOCKET,
          isAdmin: false,
          deviceInfo: DeviceInfo.create({
            ipAddress: client.handshake.address,
            userAgent: client.handshake.headers['user-agent'] as string,
          }),
          expiresAt:
            req.session?.cookie?.expires ||
            new Date(Date.now() + 1000 * 60 * 60 * 24),
        });

        // 비즈니스 훅 실행 (방 자동 조인 등)
        await this.websocketService.executeConnectHooks(client, user.id, false);
      } catch (err: any) {
        this.logger.error(
          `Failed to create WS session (userId: ${user.id}): ${err.message}`,
        );
        client.disconnect(true); // 세션 생성 실패 시 연결 강제 종료
        return;
      }
    } else {
      // 3. 익명(게스트) 유저: LOBBY 룸 등에 가입 (예: 채팅방 등)
      client.join(SOCKET_ROOMS.LOBBY);
      this.logger.log(`Anonymous client connected (Guest): ${client.id}`);
    }
  }

  async handleDisconnect(client: UserSocket) {
    const user = client.user;
    this.logger.log(`Client disconnected: ${client.id}${user ? `, userId: ${user.id}` : ''}`);

    if (!user) return;

    try {
      await this.expireSessionService.execute({
        sessionId: client.id,
        userId: user.id,
        type: SessionType.WEBSOCKET,
      });
    } catch (err) {
      // 이미 부모 세션 종료로 먼저 처리된 경우 등 — 무시
      this.logger.debug(`WS session cleanup skipped: ${client.id} — ${err?.message}`);
    }
  }



  /**
   * 특정 사용자에게 이벤트를 전송합니다.
   * @param userId 타겟 사용자 ID
   * @param event 이벤트 이름
   * @param data 전송할 데이터
   */
  emitToUser(userId: bigint, event: string, data: any): void {
    this.server.to(getSocketRoom.user(userId)).emit(event, data);
    this.logger.debug(`Emitted ${event} to user:${userId}`);
  }

  /**
   * 특정 룸에 이벤트를 전송합니다.
   * @param room 룸 이름
   * @param event 이벤트 이름
   * @param data 전송할 데이터
   */
  emitToRoom(room: SocketRoomType, event: string, data: any): void {
    this.server.to(room).emit(event, data);
  }

  /**
   * 전체 사용자에게 이벤트를 전송합니다.
   * @param event 이벤트 이름
   * @param data 전송할 데이터
   */
  emitToAll(event: string, data: any): void {
    this.server.emit(event, data);
  }

  // ============================================
  // AsyncAPI 명세: 서버 → 클라이언트 단방향 푸시 (유저 네임스페이스)
  // ============================================

  @AsyncApiPub({
    channel: 'event',
    summary: '유저 통합 이벤트 스트림 (User Single Event Stream)',
    description: `
일반 유저 및 게스트를 위한 통합 이벤트 푸시 채널입니다. (Event channel for general users and guests.)
모든 이벤트는 \`type\` 필드로 구분됩니다. (All events are distinguished by the \`type\` field.)

---

### 🔐 Authenticated User (인증 유저)
| type | Description (🇰🇷) | Description (🇺🇸) |
|---|---|---|
| \`INBOX_NEW\` | 새 받은편지함 알림 | New inbox item alert |
| \`FIAT_DEPOSIT_REQUESTED\` | 입금 요청 처리 상태 | Fiat deposit status |
| \`PROMOTION_APPLIED\` | 프로모션 적용 결과 | Promotion applied result |

### 👤 Anonymous User (익명 게스트)
| type | Description (🇰🇷) | Description (🇺🇸) |
|---|---|---|
| \`SYSTEM_NOTICE\` | 시스템 전체 공지 | Global system notice |
    `,
    message: {
      name: 'SocketEvent',
      payload: SocketEventDto,
    },
  })
  private _documentEventStream(): void {
    // AsyncAPI 문서 자동 생성을 위한 빈(dummy) 메서드입니다.
    // 실제 발송은 WebsocketService.sendToUser / sendToRoom에서 수행됩니다.
  }

  private extractUser(client: UserSocket): AuthenticatedUser | null {
    const req = client.request;

    if (req.user) {
      return req.user;
    }

    return null;
  }
}
