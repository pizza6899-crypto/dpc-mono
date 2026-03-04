import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions, Socket } from 'socket.io';
import { RequestHandler } from 'express';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { ClsService } from 'nestjs-cls';

export interface SessionMiddlewares {
    cookieParser: RequestHandler;
    userSession: RequestHandler;
    adminSession: RequestHandler;
    passportInit: RequestHandler;
    passportSession: RequestHandler;
}

export interface RedisConfig {
    host: string;
    port: number;
}

/**
 * Socket.IO 서버에 네임스페이스별로 Express 미들웨어를 주입하고
 * Redis Adapter를 통한 수평 확장을 지원합니다.
 *
 * 소켓 연결마다 nestjs-cls CLS 컨텍스트를 자동으로 생성하여
 * @Transactional() 데코레이터가 WebSocket 핸들러에서도 동작하도록 합니다.
 */
export class SessionIoAdapter extends IoAdapter {
    private adapterConstructor: ReturnType<typeof createAdapter>;
    private clsService: ClsService;

    constructor(
        app: INestApplicationContext,
        private readonly middlewares: SessionMiddlewares,
        private readonly redisConfig?: RedisConfig,
    ) {
        super(app);
        // NestJS 앱 컨테이너에서 ClsService를 직접 가져옵니다.
        this.clsService = app.get(ClsService);
    }

    async connectToRedis(): Promise<void> {
        if (!this.redisConfig) return;

        const pubClient = new Redis({
            host: this.redisConfig.host,
            port: this.redisConfig.port,
        });
        const subClient = pubClient.duplicate();

        this.adapterConstructor = createAdapter(pubClient, subClient);
    }

    createIOServer(port: number, options?: ServerOptions): Server {
        const server: Server = super.createIOServer(port, options);

        if (this.adapterConstructor) {
            server.adapter(this.adapterConstructor);
        }

        const wrap = (middleware: RequestHandler) => (socket: any, next: any) =>
            middleware(socket.request, socket.request.res || {}, next as any);

        /**
         * 소켓 연결마다 CLS 컨텍스트를 자동으로 생성하는 미들웨어
         * handleConnection, handleDisconnect, 모든 @SubscribeMessage 핸들러에서
         * @Transactional() 데코레이터가 정상 동작합니다.
         */
        const clsMiddleware = (socket: Socket, next: (err?: Error) => void) => {
            this.clsService.run(() => next());
        };

        // 1. 일반 유저 네임스페이스 (기본 '/')
        const userNamespace = server.of('/');
        userNamespace.use(wrap(this.middlewares.cookieParser));
        userNamespace.use(wrap(this.middlewares.userSession));
        userNamespace.use(wrap(this.middlewares.passportInit));
        userNamespace.use(wrap(this.middlewares.passportSession));
        userNamespace.use(clsMiddleware); // CLS 컨텍스트 주입 (마지막에 적용)

        // 2. 관리자 네임스페이스 ('/admin')
        const adminNamespace = server.of('/admin');
        adminNamespace.use(wrap(this.middlewares.cookieParser));
        adminNamespace.use(wrap(this.middlewares.adminSession));
        adminNamespace.use(wrap(this.middlewares.passportInit));
        adminNamespace.use(wrap(this.middlewares.passportSession));
        adminNamespace.use(clsMiddleware); // CLS 컨텍스트 주입 (마지막에 적용)

        return server;
    }
}

