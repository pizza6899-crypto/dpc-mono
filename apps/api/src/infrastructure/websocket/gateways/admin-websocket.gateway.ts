import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable, UseFilters, UsePipes } from '@nestjs/common';
import { getSocketRoom, SOCKET_ROOMS } from '../constants/websocket-rooms.constant';
import { UserRoleType } from '@prisma/client';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { WebsocketExceptionFilter } from '../websocket-exception.filter';
import { CustomValidationPipe } from 'src/common/http/pipes/validation.pipe';
import { AsyncApiPub } from 'src/common/decorators/async-api.decorator';
import { ExceptionResponseDto } from '../dtos/exception-response.dto';
import { corsConfig } from 'src/common/security/cors.config';
import { Request } from 'express';
import { CreateSessionService } from 'src/modules/auth/session/application/create-session.service';
import { ExpireSessionService } from 'src/modules/auth/session/application/expire-session.service';
import { SessionType, DeviceInfo } from 'src/modules/auth/session/domain';

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
@UsePipes(CustomValidationPipe)
@UseFilters(WebsocketExceptionFilter)
@Injectable()
export class AdminWebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(AdminWebsocketGateway.name);

    constructor(
        private readonly createSessionService: CreateSessionService,
        private readonly expireSessionService: ExpireSessionService,
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

            await this.createSessionService.execute({
                userId: user.id,
                sessionId: client.id,
                parentSessionId: req.sessionID,
                type: SessionType.WEBSOCKET,
                isAdmin: true, // 관리자 세션
                deviceInfo: DeviceInfo.create({
                    ipAddress: client.handshake.address,
                    userAgent: client.handshake.headers['user-agent'],
                }),
                expiresAt: req.session?.cookie?.expires || new Date(Date.now() + 1000 * 60 * 60 * 24),
            }).catch(err => this.logger.error(`Failed to create Admin WS session: ${err.message}`));
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
            await this.expireSessionService.execute({ sessionId: client.id });
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
    // AsyncAPI 문서화용 메서드 (서버 → 클라이언트 발송 이벤트)
    // ============================================

    @AsyncApiPub({
        channel: 'admin/exception',
        summary: '소켓 예외/에러 발생 알림 (어드민)',
        description: '관리자의 웹소켓 요청에 대한 오류 발생 시 보내는 예외 이벤트입니다.',
        message: {
            name: 'AdminExceptionResponse',
            payload: ExceptionResponseDto,
        },
    })
    private _documentExceptionEvent(): void {
        // 실제 전송은 WebsocketExceptionFilter에서 이루어집니다.
    }

    private extractUser(client: AdminSocket): AuthenticatedUser | null {
        const req = client.request;
        if (req.user) {
            return req.user;
        }

        return null;
    }
}
