import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseFilters, UsePipes } from '@nestjs/common';
import { createAdapter } from '@socket.io/redis-adapter';
import { RedisService } from 'src/infrastructure/redis/redis.service';
import Redis from 'ioredis';
import { EnvService } from 'src/common/env/env.service';
import session from 'express-session';
import passport from 'passport';
import { ApiProperty } from '@nestjs/swagger';
import { AsyncApiPub, AsyncApiSub } from 'nestjs-asyncapi';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CustomValidationPipe } from 'src/common/http/pipes/validation.pipe'; // 추가
import { WebsocketExceptionFilter } from 'src/common/websocket/websocket-exception.filter'; // 추가
import { ExceptionResponseDto } from 'src/common/websocket/dtos/exception-response.dto';
import { CreateSessionService } from 'src/modules/auth/session/application/create-session.service';
import { SessionTrackerService } from 'src/modules/auth/session/infrastructure/session-tracker.service';
import { SessionType, DeviceInfo } from 'src/modules/auth/session/domain';
import { extractClientInfo } from 'src/common/http/utils/request-info.util';

// DTO 클래스 정의 - export 필수!
export class MessageRequestDto {
  @ApiProperty({
    description: '메시지 텍스트',
    example: 'Hello!',
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  text: string;
}

export class MessageResponseDto {
  @ApiProperty({
    description: '발신자 소켓 ID',
    example: 'socket-id-123',
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  from: string;

  @ApiProperty({
    description: '메시지 데이터',
    type: MessageRequestDto,
    required: true,
  })
  @ValidateNested()
  @Type(() => MessageRequestDto)
  data: MessageRequestDto;
}

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
@UsePipes(CustomValidationPipe)
@UseFilters(WebsocketExceptionFilter)
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly envService: EnvService,
    private readonly createSessionService: CreateSessionService,
    private readonly sessionTracker: SessionTrackerService,
  ) {}

  // Gateway 초기화 시 Redis Adapter 설정
  afterInit(server: Server) {
    // Redis pub/sub 클라이언트 생성
    const pubClient = new Redis({
      host: this.envService.redis.host,
      port: this.envService.redis.port,
    });

    const subClient = pubClient.duplicate();
    server.adapter(createAdapter(pubClient, subClient));

    const sessionMiddleware = session({
      secret: this.envService.session.secret,
      resave: false,
      saveUninitialized: false,
    });

    server.engine.use(sessionMiddleware);
    server.engine.use(passport.initialize());
    server.engine.use(passport.session());

    // SessionTrackerService에 WebSocket 서버 등록
    this.sessionTracker.setWebSocketServer(server);

    this.logger.log(
      'WebSocket Gateway initialized with Redis Adapter and Session Support',
    );
  }

  // 클라이언트 연결 시
  async handleConnection(client: Socket) {
    // 세션에서 사용자 정보 가져오기
    const session = (client.request as any).session;
    const user = session?.passport?.user;

    if (!user) {
      this.logger.warn(`Unauthenticated connection attempt: ${client.id}`);
      client.disconnect();
      return;
    }

    this.logger.log(`User ${user.id} connected: ${client.id}`);

    try {
      // 클라이언트 정보 추출 (HTTP 세션과 동일한 정보 사용)
      const clientInfo = extractClientInfo(client.request as any);
      
      // DeviceInfo 생성 (HTTP 세션과 동일한 정보 사용)
      const deviceInfo = DeviceInfo.create({
        ipAddress: clientInfo.ip ?? null,
        userAgent: clientInfo.userAgent ?? null,
        deviceFingerprint: clientInfo.fingerprint ?? null,
        isMobile: clientInfo.isMobile ?? null,
        os: clientInfo.os ?? null,
        browser: clientInfo.browser ?? null,
      });

      // WebSocket 세션 생성
      const sessionConfig = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
        ? this.envService.adminSession
        : this.envService.session;

      const expiresAt = new Date(Date.now() + sessionConfig.maxAge);

      const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

      await this.createSessionService.execute({
        userId: user.id,
        sessionId: client.id, // Socket.io socket ID를 세션 ID로 사용
        type: SessionType.WEBSOCKET,
        isAdmin,
        deviceInfo,
        expiresAt,
      });

      // Room에 조인 (userId와 sessionId)
      client.join(user.id.toString()); // 모든 사용자 연결을 userId Room에 조인
      client.join(client.id); // 특정 세션 소켓을 sessionId Room에 조인

      this.logger.log(
        `WebSocket 세션 생성 완료: socketId=${client.id}, userId=${user.id}`,
      );
    } catch (error) {
      this.logger.error(
        error,
        `WebSocket 세션 생성 실패: socketId=${client.id}, userId=${user.id}`,
      );
      // 세션 생성 실패 시 연결 해제
      client.disconnect();
    }
  }

  // 클라이언트 연결 해제 시
  async handleDisconnect(client: Socket) {
    const session = (client.request as any).session;
    const user = session?.passport?.user;

    if (user) {
      await this.unmapUserFromSocket(user.id, client.id);
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // 메시지 구독 예제
  // 서버가 클라이언트로 메시지를 보낼 때 (Pub 데코레이터 추가)
  @AsyncApiSub({
    channel: 'message',
    summary: '메시지 브로드캐스트',
    description: '서버가 모든 클라이언트에게 메시지를 브로드캐스트합니다',
    message: {
      name: 'MessageResponse',
      payload: MessageRequestDto,
    },
  })
  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: MessageRequestDto): void {
    // 유효성 검사 통과한 경우에만 여기 도달
    this.logger.log(`Message from ${data.text}: ${JSON.stringify(data)}`);

    // 성공 응답 (선택사항)
    // this.server.to(client.id).emit('message:success', { data });
  }

  // ============================================
  // AsyncAPI 문서화용 메서드 (서버 → 클라이언트)
  // ============================================

  // 예외 이벤트 문서화 (실제 emit은 WebsocketExceptionFilter에서 처리)
  @AsyncApiPub({
    channel: 'exception',
    summary: '예외 응답',
    description:
      '서버에서 발생한 예외를 클라이언트에게 전송합니다. 모든 예외는 이 이벤트를 통해 전달됩니다.',
    message: {
      name: 'ExceptionResponse',
      payload: ExceptionResponseDto,
    },
  })
  private documentExceptionEvent(): void {
    // 문서화용 메서드 - 실제로는 WebsocketExceptionFilter에서 emit됩니다
  }

  // 특정 사용자에게 메시지 전송
  async sendToUser(userId: string, event: string, data: any) {
    // userId -> socketId 매핑 필요
    const socketIds = await this.getUserSocketIds(userId);

    socketIds.forEach((socketId) => {
      this.server.to(socketId).emit(event, data);
    });
  }

  // 모든 사용자에게 브로드캐스트
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }

  // Room 기능
  joinRoom(socketId: string, room: string) {
    const socket = this.server.sockets.sockets.get(socketId);
    if (socket) {
      socket.join(room);
      this.logger.log(`Socket ${socketId} joined room: ${room}`);
    }
  }

  leaveRoom(socketId: string, room: string) {
    const socket = this.server.sockets.sockets.get(socketId);
    if (socket) {
      socket.leave(room);
      this.logger.log(`Socket ${socketId} left room: ${room}`);
    }
  }

  // Room에 메시지 전송
  sendToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }

  // Helper: userId로 socketId 조회 (Redis 활용)
  private async getUserSocketIds(userId: string): Promise<string[]> {
    const socketIds = await this.redisService.get<string[]>(
      `user:${userId}:sockets`,
    );
    return socketIds || [];
  }

  // Helper: userId와 socketId 매핑 저장
  async mapUserToSocket(userId: string, socketId: string) {
    const socketIds = await this.getUserSocketIds(userId);
    socketIds.push(socketId);
    await this.redisService.set(`user:${userId}:sockets`, socketIds, 3600);
  }

  // Helper: userId와 socketId 매핑 제거
  async unmapUserFromSocket(userId: string, socketId: string) {
    const socketIds = await this.getUserSocketIds(userId);
    const filtered = socketIds.filter((id) => id !== socketId);
    await this.redisService.set(`user:${userId}:sockets`, filtered, 3600);
  }
}
