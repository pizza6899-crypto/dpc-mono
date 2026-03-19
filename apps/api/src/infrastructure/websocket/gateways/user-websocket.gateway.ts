import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';
import {
  getSocketRoom,
  SOCKET_ROOMS,
} from '../constants/websocket-rooms.constant';
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
export class UserWebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(UserWebsocketGateway.name);

  constructor(
    private readonly createSessionService: CreateSessionService,
    private readonly expireSessionService: ExpireSessionService,
    @Inject(forwardRef(() => WebsocketService))
    private readonly websocketService: WebsocketService,
  ) {}

  async handleConnection(client: UserSocket) {
    const user = this.extractUser(client);

    // 공통적으로 모든 사용자는 GLOBAL 룸에 자동 가입 (브로드캐스트용)
    client.join(SOCKET_ROOMS.GLOBAL);

    if (user) {
      // 1. 인증된 유저: 유저 고유 룸 조인
      client.join(getSocketRoom.user(user.id));
      this.logger.log(
        `User connected: ${client.id}, userId: ${user.id}, role: ${user.role}`,
      );

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
    this.logger.log(
      `Client disconnected: ${client.id}${user ? `, userId: ${user.id}` : ''}`,
    );

    if (!user) return;

    try {
      await this.expireSessionService.execute({
        sessionId: client.id,
        userId: user.id,
        type: SessionType.WEBSOCKET,
      });
    } catch (err) {
      // 이미 부모 세션 종료로 먼저 처리된 경우 등 — 무시
      this.logger.debug(
        `WS session cleanup skipped: ${client.id} — ${err?.message}`,
      );
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
Integrated event push channel for general users. (일반 유저를 위한 통합 이벤트 푸시 채널입니다.)

---

### 💬 Chat & Support Events (채팅 및 상담 실시간 스트림)
Events delivered in real-time to users joined in a specific room. (특정 방에 참여 중인 유저에게 전달되는 실시간 이벤트입니다.)

| Event Type (type) | Description (🇰🇷) / Payload Fields | Description (🇺🇸) |
|---|---|---|
| \`CHAT_MESSAGE_NEW\` | **커뮤니티 새 메시지** <br/> \`id\`, \`roomId\`, \`senderId\`, \`content\`, \`type\`, \`metadata\`, \`createdAt\` | New message in public chat |
| \`SUPPORT_CHAT_MESSAGE_NEW\` | **상담 새 메시지** <br/> \`id\`, \`roomId\`, \`senderId\`, \`content\`, \`type\`, \`metadata\`, \`createdAt\` | New message in support chat |
| \`CHAT_MESSAGES_READ\` | **메시지 읽음 확인** <br/> \`roomId\`, \`userId\`, \`lastReadMessageId\` | Message read acknowledgement |
| \`SUPPORT_CHAT_MESSAGES_READ\` | **상담 읽음 확인** <br/> \`roomId\`, \`userId\`, \`lastReadMessageId\` | Support read acknowledgement |

---

### 🔔 User Private Notifications (유저 전용 개인 알림)
Private notifications sent only to the authenticated user. (인증된 해당 유저에게만 전송되는 개인 알림입니다.)

| Event Type (type) | Description (🇰🇷) / Payload Fields | Description (🇺🇸) |
|---|---|---|
| \`INBOX_NEW\` | **새 알림 도착** <br/> \`id\`, \`event\`, \`title\`, \`body\`, \`actionUri\`, \`createdAt\` | New inbox/notification item |

---

### 📖 Schema Details (주요 필드 상세 설명)
- **id / roomId / senderId**: All IDs are provided as **Sqids** (obfuscated strings). (모든 ID는 난독화된 문자열인 Sqids 형태로 제공됩니다.)
- **type (Message)**: Indicates the type of message (\`TEXT\`, \`IMAGE\`, etc.). (메시지의 종류를 나타냅니다.)
- **metadata**: Contains additional info like image attachments or reply targets. (이미지 첨부 정보나 답장 대상 등 부가 정보를 포함합니다.)

---

#### 📝 Example Payloads (이벤트 예시 데이터)

**1. New Chat Message (새 채팅 메시지)**
\`\`\`json
{
    "type": "CHAT_MESSAGE_NEW",
    "payload": {
        "id": "msg_sqid",
        "roomId": "room_sqid",
        "senderId": "user_sqid",
        "content": "이미지 확인 부탁드립니다.",
        "type": "IMAGE",
        "metadata": {
            "attachments": [{
                "fileId": "file_sqid",
                "type": "IMAGE",
                "width": 800,
                "height": 600
            }]
        },
        "createdAt": "2026-03-10T07:25:00.000Z"
    },
    "timestamp": "2026-03-10T07:25:00.005Z"
}
\`\`\`

**2. Support Message Read (상담 읽음 확인)**
\`\`\`json
{
    "type": "SUPPORT_CHAT_MESSAGES_READ",
    "payload": {
        "roomId": "room_sqid",
        "userId": "admin_sqid",
        "lastReadMessageId": "msg_sqid"
    },
    "timestamp": "2026-03-10T07:20:00.000Z"
}
\`\`\`
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
