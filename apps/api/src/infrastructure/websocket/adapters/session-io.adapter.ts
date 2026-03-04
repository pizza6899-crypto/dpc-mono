import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions } from 'socket.io';
import { RequestHandler } from 'express';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

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
 */
export class SessionIoAdapter extends IoAdapter {
    private adapterConstructor: ReturnType<typeof createAdapter>;

    constructor(
        app: INestApplicationContext,
        private readonly middlewares: SessionMiddlewares,
        private readonly redisConfig?: RedisConfig,
    ) {
        super(app);
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

        // 1. 일반 유저 네임스페이스 (기본 '/')
        const userNamespace = server.of('/');
        userNamespace.use(wrap(this.middlewares.cookieParser));
        userNamespace.use(wrap(this.middlewares.userSession));
        userNamespace.use(wrap(this.middlewares.passportInit));
        userNamespace.use(wrap(this.middlewares.passportSession));

        // 2. 관리자 네임스페이스 ('/admin')
        const adminNamespace = server.of('/admin');
        adminNamespace.use(wrap(this.middlewares.cookieParser));
        adminNamespace.use(wrap(this.middlewares.adminSession));
        adminNamespace.use(wrap(this.middlewares.passportInit));
        adminNamespace.use(wrap(this.middlewares.passportSession));

        return server;
    }
}
