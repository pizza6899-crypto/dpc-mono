import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
@Injectable()
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SocketGateway.name);

  constructor() {
    // private readonly jwtService: JwtService, // 필요시 JWT 검증
  }

  handleConnection(client: Socket) {
    const userId = this.extractUserId(client);
    if (userId) {
      client.join(`user:${userId}`);
      this.logger.log(`Client connected: ${client.id}, userId: ${userId}`);
    } else {
      this.logger.warn(`Client connected without userId: ${client.id}`);
      // 인증 실패 시 연결 끊기 옵션 고려
      // client.disconnect();
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
   * 특정 사용자에게 이벤트를 전송합니다.
   * @param userId 타겟 사용자 ID
   * @param event 이벤트 이름
   * @param data 전송할 데이터
   */
  emitToUser(userId: string | bigint, event: string, data: any): void {
    this.server.to(`user:${userId}`).emit(event, data);
    this.logger.debug(`Emitted ${event} to user:${userId}`);
  }

  /**
   * 특정 룸에 이벤트를 전송합니다.
   * @param room 룸 이름
   * @param event 이벤트 이름
   * @param data 전송할 데이터
   */
  emitToRoom(room: string, event: string, data: any): void {
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

  private extractUserId(client: Socket): string | null {
    // 1. Handshake Auth에서 추출 (클라이언트가 socket 연결 시 auth: { token: ... } 등으로 보낼 때)
    const token =
      client.handshake.auth?.token || client.handshake.headers?.authorization;

    // TODO: JWT 검증 로직 구현
    // 지금은 개발 편의를 위해 auth.userId를 직접 믿거나, 간단히 처리
    const userId =
      client.handshake.query?.userId || client.handshake.auth?.userId;

    return userId ? String(userId) : null;
  }
}
