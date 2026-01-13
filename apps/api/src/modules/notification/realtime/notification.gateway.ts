// apps/api/src/modules/notification/realtime/notification.gateway.ts

import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

interface NotificationPayload {
    id: string;
    createdAt: string;
    title: string;
    body: string;
    actionUri: string | null;
    metadata?: Record<string, unknown> | null;
}

@WebSocketGateway({
    namespace: '/notifications',
    cors: {
        origin: '*',
        credentials: true,
    },
})
export class NotificationGateway
    implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(NotificationGateway.name);

    handleConnection(client: Socket) {
        const userId = this.extractUserId(client);
        if (userId) {
            client.join(`user:${userId}`);
            this.logger.log(`Client connected: ${client.id}, userId: ${userId}`);
        } else {
            this.logger.warn(`Client connected without userId: ${client.id}`);
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('ping')
    handlePing(_client: Socket): string {
        return 'pong';
    }

    /**
     * 영구 알림 전송 (IN_APP 채널, DB에 저장됨)
     */
    emitNotification(userId: bigint, notification: NotificationPayload): void {
        this.server.to(`user:${userId}`).emit('notification:new', notification);
        this.logger.debug(`Emitted notification to user:${userId}`);
    }

    /**
     * 휘발성 이벤트 전송 (DB 저장 안 됨)
     */
    emitToUser(userId: bigint, event: string, data: unknown): void {
        this.server.to(`user:${userId}`).emit(event, data);
        this.logger.debug(`Emitted ${event} to user:${userId}`);
    }

    /**
     * 배지 카운트 업데이트
     */
    emitBadgeUpdate(userId: bigint, count: number): void {
        this.server.to(`user:${userId}`).emit('badge:update', { count });
    }

    /**
     * 잔액 업데이트
     */
    emitBalanceUpdate(userId: bigint, balance: string): void {
        this.server.to(`user:${userId}`).emit('balance:update', { balance });
    }

    private extractUserId(client: Socket): string | null {
        // JWT 토큰에서 userId 추출 (실제 구현 필요)
        const userId = client.handshake.auth?.userId;
        return userId ? String(userId) : null;
    }
}
