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
import { UserRoleType } from '@prisma/client';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { AsyncApiPub } from 'src/common/decorators/async-api.decorator';
import { SocketEventDto } from '../dtos/socket-event.dto';
import { corsConfig } from 'src/common/security/cors.config';
import { Request } from 'express';
import { CreateSessionService } from 'src/modules/auth/session/application/create-session.service';
import { ExpireSessionService } from 'src/modules/auth/session/application/expire-session.service';
import { SessionType, DeviceInfo } from 'src/modules/auth/session/domain';
import { forwardRef, Inject } from '@nestjs/common';
import { WebsocketService } from '../websocket.service';

/**
 * 관리자 웹소켓 소켓 확장 인터페이스
 */
interface AdminSocket extends Socket {
  user?: AuthenticatedUser;
  request: Request;
}

@WebSocketGateway({
  namespace: '/admin',
  cors: {
    origin: corsConfig.origin,
    credentials: true,
  },
})
@Injectable()
export class AdminWebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AdminWebsocketGateway.name);

  constructor(
    private readonly createSessionService: CreateSessionService,
    private readonly expireSessionService: ExpireSessionService,
    @Inject(forwardRef(() => WebsocketService))
    private readonly websocketService: WebsocketService,
  ) {}

  async handleConnection(client: AdminSocket) {
    const user = this.extractUser(client);

    // 관리자 구역(/admin) - ADMIN, SUPER_ADMIN 역할만 소켓 연결 허용
    if (
      user &&
      (user.role === UserRoleType.ADMIN ||
        user.role === UserRoleType.SUPER_ADMIN)
    ) {
      client.join(SOCKET_ROOMS.ADMIN);
      client.join(getSocketRoom.admin(user.id));
      this.logger.log(
        `Admin client connected: ${client.id}, adminId: ${user.id}, role: ${user.role}`,
      );

      // DB 세션 생성 (WebSocket 타입)
      const req = client.request;
      client.user = user;

      try {
        await this.createSessionService.execute({
          userId: user.id,
          sessionId: client.id,
          parentSessionId: req.sessionID,
          type: SessionType.WEBSOCKET,
          isAdmin: true, // 관리자 세션
          deviceInfo: DeviceInfo.create({
            ipAddress: client.handshake.address,
            userAgent: client.handshake.headers['user-agent'] as string,
          }),
          expiresAt:
            req.session?.cookie?.expires ||
            new Date(Date.now() + 1000 * 60 * 60 * 24),
        });

        // 비즈니스 훅 실행 (담당 중인 방 자동 조인 등)
        await this.websocketService.executeConnectHooks(client, user.id, true);
      } catch (err: any) {
        this.logger.error(
          `Failed to create Admin WS session (adminId: ${user.id}): ${err.message}`,
        );
        client.disconnect(true); // 세션 생성 실패 시 연결 강제 종료
        return;
      }
    } else {
      this.logger.warn(
        `Non-admin or unauthenticated client tried to connect to /admin: ${client.id}`,
      );
      client.disconnect();
    }
  }

  async handleDisconnect(client: AdminSocket) {
    const user = client.user;
    this.logger.log(
      `Admin client disconnected: ${client.id}${user ? `, userId: ${user.id}` : ''}`,
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
        `Admin WS session cleanup skipped: ${client.id} — ${err?.message}`,
      );
    }
  }

  emitToAdmin(adminId: bigint, event: string, data: any): void {
    this.server.to(getSocketRoom.admin(adminId)).emit(event, data);
    this.logger.debug(`Emitted ${event} to admin:${adminId}`);
  }

  emitToAdminRoom(event: string, data: any): void {
    // /admin 네임스페이스의 'admin' 룸에 이벤트 전송
    this.server.to(SOCKET_ROOMS.ADMIN).emit(event, data);
    this.logger.debug(
      `Emitted ${event} to /admin -> room: ${SOCKET_ROOMS.ADMIN}`,
    );
  }

  /**
   * 특정 룸에 이벤트를 전송합니다.
   */
  emitToRoom(room: string, event: string, data: any): void {
    this.server.to(room).emit(event, data);
    this.logger.debug(`Emitted ${event} to admin room:${room}`);
  }

  // ============================================
  // AsyncAPI 명세: 서버 → 클라이언트 단방향 푸시 (관리자 네임스페이스)
  // ============================================

  @AsyncApiPub({
    channel: 'admin/event',
    summary: 'Admin Integrated Event Stream (관리자 통합 이벤트 스트림)',
    description: `
Dedicated push channel for the admin dashboard. (관리자 대시보드를 위한 전용 푸시 채널입니다.)

---

### 🛡️ Real-time Admin Notifications (관리자 전용 실시간 알림)
Pure business data is transmitted to the admin, rather than pre-processed UI data. (관리자에게는 UI 가공 데이터가 아닌 **순수 비즈니스 데이터**가 전송됩니다.)

| Event Type (type) | Description (🇰🇷) / Payload Fields | Description (🇺🇸) |
|---|---|---|
| \`SUPPORT_INQUIRY_RECEIVED\` | **신규 상담 문의 접수** <br/> \`roomId\`, \`userId\`, \`userNickname\`, \`requestedAt\` | New support inquiry alert |
| \`FIAT_DEPOSIT_REQUESTED\` | **신규 입금 신청 발생** <br/> \`id\`, \`depositorName\`, \`amount\`, \`currency\`, \`requestedAt\` | New fiat deposit request |
| \`WITHDRAW_REQUESTED\` | **신규 출금 신청 발생** <br/> \`id\`, \`userId\`, \`amount\`, \`currency\`, \`requestedAt\` | New withdrawal request |

---

### 💬 Chat & Support Events (채팅 및 상담 실시간 스트림)
Shared between users and admins within specific rooms. (특정 방에 참여 중인 유저와 관리자가 공통으로 수신합니다.)

| Event Type (type) | Description (🇰🇷) / Payload | Description (🇺🇸) |
|---|---|---|
| \`CHAT_MESSAGE_NEW\` | **커뮤니티 새 메시지** <br/> \`id\`, \`roomId\`, \`senderId\`, \`content\`, \`type\`, \`metadata\`, \`createdAt\` | New community msg |
| \`SUPPORT_CHAT_MESSAGE_NEW\` | **상담 새 메시지** <br/> \`id\`, \`roomId\`, \`senderId\`, \`content\`, \`type\`, \`metadata\`, \`createdAt\` | New support msg |
| \`CHAT_MESSAGES_READ\` | **메시지 읽음 확인** <br/> \`roomId\`, \`userId\`, \`lastReadMessageId\` | Msg read ack |
| \`SUPPORT_CHAT_MESSAGES_READ\` | **상담 읽음 확인** <br/> \`roomId\`, \`userId\`, \`lastReadMessageId\` | Support read ack |

---

#### 📝 Example Payload (상담 메시지 예시)
\`\`\`json
{
    "type": "SUPPORT_CHAT_MESSAGE_NEW",
    "payload": {
        "id": "23282357591089152",
        "roomId": "room_sqid",
        "senderId": "user_sqid",
        "content": "안녕하세요, 문의 드립니다.",
        "type": "TEXT",
        "metadata": null,
        "createdAt": "2026-03-10T07:18:54.018Z"
    },
    "timestamp": "2026-03-10T07:18:54.023Z"
}
\`\`\`
        `,
    message: {
      name: 'AdminSocketEvent',
      payload: SocketEventDto,
    },
  })
  private _documentEventStream(): void {
    // AsyncAPI 문서 자동 생성을 위한 빈(dummy) 메서드입니다.
    // 실제 발송은 WebsocketService.sendToUser / sendToRoom에서 수행됩니다.
  }

  private extractUser(client: AdminSocket): AuthenticatedUser | null {
    const req = client.request;
    if (req.user) {
      return req.user;
    }

    return null;
  }
}
