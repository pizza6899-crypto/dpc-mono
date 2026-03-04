import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable, UseFilters, UsePipes } from '@nestjs/common';
import { getSocketRoom, SOCKET_ROOMS } from '../constants/websocket-rooms.constant';
import type { SocketRoomType } from '../constants/websocket-rooms.constant';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { WebsocketExceptionFilter } from '../websocket-exception.filter';
import { CustomValidationPipe } from 'src/common/http/pipes/validation.pipe';
import { AsyncApiPub, AsyncApiSub } from 'src/common/decorators/async-api.decorator';
import { ExceptionResponseDto } from '../dtos/exception-response.dto';
import { RoomRequestDto } from '../dtos/room-request.dto';
import { SocketResponseDto } from '../dtos/socket-response.dto';
import { Request } from 'express';
import { CreateSessionService } from 'src/modules/auth/session/application/create-session.service';
import { ExpireSessionService } from 'src/modules/auth/session/application/expire-session.service';
import { SessionType, DeviceInfo } from 'src/modules/auth/session/domain';

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
@UsePipes(CustomValidationPipe)
@UseFilters(WebsocketExceptionFilter)
@Injectable()
export class UserWebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(UserWebsocketGateway.name);

  constructor(
    private readonly createSessionService: CreateSessionService,
    private readonly expireSessionService: ExpireSessionService,
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

      await this.createSessionService.execute({
        userId: user.id,
        sessionId: client.id,
        parentSessionId: req.sessionID,
        type: SessionType.WEBSOCKET,
        isAdmin: false,
        deviceInfo: DeviceInfo.create({
          ipAddress: client.handshake.address,
          userAgent: client.handshake.headers['user-agent'],
        }),
        expiresAt: req.session?.cookie?.expires || new Date(Date.now() + 1000 * 60 * 60 * 24),
      }).catch(err => this.logger.error(`Failed to create WS session: ${err.message}`));
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
   * 클라이언트를 특정 룸에 가입시킵니다.
   * (추후 관리자 권한 검증 등 보안 로직 추가 예정)
   */
  @AsyncApiSub({
    channel: 'room:join',
    summary: '특정 룸 가입 (Join specific room)',
    description: '클라이언트가 특정 소켓 룸에 가입합니다. (Client joins a specific socket room.)',
    message: {
      payload: RoomRequestDto,
    },
  })
  @SubscribeMessage('room:join')
  handleJoinRoom(client: Socket, dto: RoomRequestDto): SocketResponseDto {
    client.join(dto.room as SocketRoomType);
    this.logger.debug(`Client ${client.id} joined room: ${dto.room}`);

    return SocketResponseDto.success(null, `Joined room ${dto.room}`);
  }

  /**
   * 클라이언트를 특정 룸에서 퇴장시킵니다.
   */
  @AsyncApiSub({
    channel: 'room:leave',
    summary: '특정 룸 퇴장 (Leave specific room)',
    description: '클라이언트가 가입했던 룸에서 퇴장합니다. (Client leaves a previously joined room.)',
    message: {
      payload: RoomRequestDto,
    },
  })
  @SubscribeMessage('room:leave')
  handleLeaveRoom(client: Socket, dto: RoomRequestDto): SocketResponseDto {
    client.leave(dto.room as SocketRoomType);
    this.logger.debug(`Client ${client.id} left room: ${dto.room}`);

    return SocketResponseDto.success(null, `Left room ${dto.room}`);
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
  // AsyncAPI 문서화용 메서드 (서버 → 클라이언트 발송 이벤트)
  // ============================================

  @AsyncApiPub({
    channel: 'user/exception',
    summary: '사용자 예외 발생 알림 (User exception notification)',
    description: '사용자 요청 처리 중 발생한 예외를 전송합니다. (Sends exceptions occurred during user request processing.)',
    message: {
      payload: ExceptionResponseDto,
    },
  })
  private _documentExceptionEvent(): void {
    // 실제 전송은 WebsocketExceptionFilter에서 이루어집니다. 문서화만을 위한 빈 메서드입니다.
  }

  private extractUser(client: UserSocket): AuthenticatedUser | null {
    const req = client.request;

    if (req.user) {
      return req.user;
    }

    return null;
  }
}
