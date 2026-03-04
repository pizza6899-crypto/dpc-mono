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

@WebSocketGateway({
  namespace: '/', // 일반 유저 네임스페이스
  cors: {
    origin: '*',
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

  constructor() {
  }

  handleConnection(client: Socket) {
    const user = this.extractUser(client);

    // 공통적으로 모든 사용자는 GLOBAL 룸에 자동 가입 (브로드캐스트용)
    client.join(SOCKET_ROOMS.GLOBAL);

    if (user) {
      // 1. 인증된 유저: 유저 고유 룸 조인
      client.join(getSocketRoom.user(user.id));
      this.logger.log(`User connected: ${client.id}, userId: ${user.id}, role: ${user.role}`);
    } else {
      // 2. 익명(게스트) 유저: LOBBY 룸 등에 가입 (예: 채팅방 등)
      client.join(SOCKET_ROOMS.LOBBY);
      this.logger.log(`Anonymous client connected (Guest): ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * 클라이언트를 특정 룸에 가입시킵니다.
   * (추후 관리자 권한 검증 등 보안 로직 추가 예정)
   */
  @AsyncApiSub({
    channel: 'user/room:join',
    summary: '특정 룸 가입',
    description: '클라이언트가 특정 소켓 룸(예: chat:support:123 등) 이벤트 수신을 위해 룸에 가입합니다. 응답(Ack)으로 SocketResponseDto 객체를 반환합니다.',
    message: {
      name: 'JoinRoomRequest',
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
    channel: 'user/room:leave',
    summary: '특정 룸 퇴장',
    description: '클라이언트가 가입했던 룸에서 퇴장하여 해당 룸의 이벤트를 수신하지 않습니다. 응답(Ack)으로 SocketResponseDto 객체를 반환합니다.',
    message: {
      name: 'LeaveRoomRequest',
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
    summary: '소켓 예외/에러 발생 알림',
    description: '클라이언트의 웹소켓 요청에 대한 오류나 백엔드의 서버 장애 발생 시 서버에서 보내는 예외 이벤트입니다.',
    message: {
      name: 'ExceptionResponse',
      payload: ExceptionResponseDto,
    },
  })
  private _documentExceptionEvent(): void {
    // 실제 전송은 WebsocketExceptionFilter에서 이루어집니다. 문서화만을 위한 빈 메서드입니다.
  }

  private extractUser(client: Socket): AuthenticatedUser | null {
    // passport.session() 미들웨어를 통과하면 client.request 에 user 객체가 주입됩니다.
    // SessionIoAdapter를 통해 소켓 연결 시에도 동일한 혜택을 받습니다.
    const req = client.request as any;
    if (req.user) {
      return req.user as AuthenticatedUser;
    }

    return null;
  }
}
