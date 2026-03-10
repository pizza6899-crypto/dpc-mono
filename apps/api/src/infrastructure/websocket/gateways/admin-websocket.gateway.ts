import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';
import { getSocketRoom, SOCKET_ROOMS } from '../constants/websocket-rooms.constant';
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
export class AdminWebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(AdminWebsocketGateway.name);

    constructor(
        private readonly createSessionService: CreateSessionService,
        private readonly expireSessionService: ExpireSessionService,
        @Inject(forwardRef(() => WebsocketService))
        private readonly websocketService: WebsocketService,
    ) { }

    async handleConnection(client: AdminSocket) {
        const user = this.extractUser(client);

        // 관리자 구역(/admin) - ADMIN, SUPER_ADMIN 역할만 소켓 연결 허용
        if (user && (user.role === UserRoleType.ADMIN || user.role === UserRoleType.SUPER_ADMIN)) {
            client.join(SOCKET_ROOMS.ADMIN);
            client.join(getSocketRoom.admin(user.id));
            this.logger.log(`Admin client connected: ${client.id}, adminId: ${user.id}, role: ${user.role}`);

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
            this.logger.warn(`Non-admin or unauthenticated client tried to connect to /admin: ${client.id}`);
            client.disconnect();
        }
    }

    async handleDisconnect(client: AdminSocket) {
        const user = client.user;
        this.logger.log(`Admin client disconnected: ${client.id}${user ? `, userId: ${user.id}` : ''}`);

        if (!user) return;

        try {
            await this.expireSessionService.execute({
                sessionId: client.id,
                userId: user.id,
                type: SessionType.WEBSOCKET,
            });
        } catch (err) {
            // 이미 부모 세션 종료로 먼저 처리된 경우 등 — 무시
            this.logger.debug(`Admin WS session cleanup skipped: ${client.id} — ${err?.message}`);
        }
    }

    emitToAdmin(adminId: bigint, event: string, data: any): void {
        this.server.to(getSocketRoom.admin(adminId)).emit(event, data);
        this.logger.debug(`Emitted ${event} to admin:${adminId}`);
    }

    emitToAdminRoom(event: string, data: any): void {
        // /admin 네임스페이스의 'admin' 룸에 이벤트 전송
        this.server.to(SOCKET_ROOMS.ADMIN).emit(event, data);
        this.logger.debug(`Emitted ${event} to /admin -> room: ${SOCKET_ROOMS.ADMIN}`);
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
Pure business data is transmitted to the admin, rather than pre-processed UI data. The frontend should handle tasks such as playing notification sounds and routing to the appropriate list based on the received \`id\`. (관리자에게는 UI 조립용 가공 데이터가 아닌, **순수 비즈니스 데이터**가 전송됩니다. 프론트엔드는 수신된 \`id\` 등을 바탕으로 알림음을 재생하고, 필요한 목록으로 이동(Routing) 처리를 수행해야 합니다.)

| type | Description (🇰🇷) / Payload Fields | Description (🇺🇸) |
|---|---|---|
| \`FIAT_DEPOSIT_REQUESTED\` | **신규 입금 신청 발생** <br/> \`id\`, \`depositorName\`, \`amount\`, \`currency\`, \`requestedAt\` | New fiat deposit request |
| \`WITHDRAW_REQUESTED\` | **신규 출금 신청 발생** <br/> \`id\`, \`userId\`, \`amount\`, \`currency\`, \`requestedAt\` | New withdrawal request |

---

#### 📝 Example Payload (입금 신청 예시)
\`\`\`json
{
    "type": "FIAT_DEPOSIT_REQUESTED",
    "payload": {
        "id": "23282357591089152",
        "depositorName": "John Doe",
        "amount": "100000",
        "currency": "KRW",
        "requestedAt": "2026-03-06T07:18:54.018Z"
    },
    "timestamp": "2026-03-06T07:18:54.023Z"
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
