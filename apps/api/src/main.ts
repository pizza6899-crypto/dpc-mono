import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import compression from 'compression';
import { corsConfig } from './common/security/cors.config';
import { helmetConfig } from './common/security/helmet.config';
import { TransformInterceptor } from './common/http/interceptors/transform.interceptor';
import { CustomValidationPipe } from './common/http/pipes/validation.pipe';
import { EnvService } from './infrastructure/env/env.service';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { Reflector } from '@nestjs/core';
import session from 'express-session';
import passport from 'passport';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { SessionIoAdapter } from './infrastructure/websocket/adapters/session-io.adapter';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/client';

// BigInt JSON 직렬화 설정
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  try {
    Decimal.set({
      precision: 32,
      rounding: Prisma.Decimal.ROUND_HALF_UP,
      toExpNeg: -19,
      toExpPos: 15,
    });

    Prisma.Decimal.set({
      precision: 32,
      rounding: Prisma.Decimal.ROUND_HALF_UP,
      toExpNeg: -19,
      toExpPos: 15,
    });

    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      bufferLogs: true,
    });

    app.useLogger(app.get(Logger));

    // Cloudflare/프록시 환경을 위한 trust proxy 설정
    app.getHttpAdapter().getInstance().set('trust proxy', true);

    // 1. Cookie Parser 설정 (가장 먼저)
    app.use(cookieParser());

    // 2. CORS 설정 (세션 설정 전에)
    app.enableCors(corsConfig);

    // 3. Compression 설정
    app.use(
      compression({
        level: 6,
        threshold: 1024,
        filter: (req, res) => {
          if (req.headers['x-no-compression']) {
            return false;
          }
          return compression.filter(req, res);
        },
      }),
    );

    app.use(helmetConfig);

    const envService = app.get(EnvService);
    const isDevelopment = envService.nodeEnv === 'development';

    const redisClient = createClient({
      socket: {
        host: envService.redis.host,
        port: envService.redis.port,
      },
    });

    await redisClient.connect();

    // 일반 사용자 세션 미들웨어 (한 번만 생성)
    const userSessionMiddleware = session({
      store: new RedisStore({
        client: redisClient,
        prefix: 'sess:',
      }),
      secret: envService.session.secret,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        secure: envService.session.secure,
        httpOnly: envService.session.httpOnly,
        maxAge: envService.session.maxAgeMs,
        sameSite: envService.session.sameSite,
      },
      name: envService.session.name,
    });

    // 관리자 세션 미들웨어 (한 번만 생성)
    const adminSessionMiddleware = session({
      store: new RedisStore({
        client: redisClient,
        prefix: 'admin-sess:',
      }),
      secret: envService.adminSession.secret,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        secure: envService.adminSession.secure,
        httpOnly: envService.adminSession.httpOnly,
        maxAge: envService.adminSession.maxAgeMs,
        sameSite: envService.adminSession.sameSite,
      },
      name: envService.adminSession.name,
    });

    app.use('/admin', adminSessionMiddleware);
    app.use(unlessAdmin(userSessionMiddleware));
    app.use(passport.initialize());

    // 조건부로 passport.session() 적용
    app.use((req, res, next) => {
      if (req.path.startsWith('/admin')) {
        // 관리자 경로는 이미 adminSessionMiddleware가 적용됨
        return passport.session()(req, res, next);
      } else {
        // 일반 사용자 경로는 userSessionMiddleware가 적용됨
        return passport.session()(req, res, next);
      }
    });

    // 소켓 어댑터 등록 (네임스페이스 기반 세션/패스포트 연동 + Redis Adapter)
    const socketAdapter = new SessionIoAdapter(
      app,
      {
        cookieParser: cookieParser(),
        userSession: userSessionMiddleware,
        adminSession: adminSessionMiddleware,
        passportInit: passport.initialize(),
        passportSession: passport.session(),
      },
      {
        host: envService.redis.host,
        port: envService.redis.port,
      },
    );
    await socketAdapter.connectToRedis();
    app.useWebSocketAdapter(socketAdapter);

    app.useGlobalInterceptors(new TransformInterceptor(app.get(Reflector)));
    app.useGlobalPipes(new CustomValidationPipe());

    // 정적 파일 서빙 설정 추가
    // app.useStaticAssets(join(process.cwd(), 'public'), {
    //   prefix: '/static',
    // });

    if (isDevelopment) {
      const config = new DocumentBuilder()
        .setTitle('DPC Backend API')
        .setDescription('DPC Backend API 문서')
        .setVersion('1.0')
        .addCookieAuth(envService.session.name)
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api', app, document, {
        swaggerOptions: {
          persistAuthorization: true, // 새로고침 해도 토큰 유지
          tagsSorter: 'alpha', // 태그 정렬
          operationsSorter: 'alpha', // API 정렬
          docExpansion: 'none', // 기본적으로 접어두기
        },
      });

      // AsyncAPI 설정 (운영 환경 제외)
      if (envService.app.nodeEnv !== 'production') {
        const {
          AsyncApiModule: DynamicAsyncApiModule,
          AsyncApiDocumentBuilder: DynamicAsyncApiDocumentBuilder,
        } = require('nestjs-asyncapi');

        const asyncApiOptions = new DynamicAsyncApiDocumentBuilder()
          .setTitle('DPC Backend WebSocket API')
          .setDescription(
            `
실시간 이벤트 통신 시스템 가이드 (Real-time Event System Guide)
---

### 📢 Operational Policy (운영 정책)
- **Server Push Only (일방향 푸시)**
  - 🇰🇷 모든 채널은 서버에서 클라이언트로의 일방향 푸시 전용입니다. 요청은 REST API를 이용하세요.
  - 🇺🇸 All channels are Server-to-Client only. Use REST API for all requests.
- **Single Event Pattern (단일 이벤트 패턴)**
  - 🇰🇷 모든 클라이언트(유저, 게스트, 관리자 공통)는 \`socket.on('event', ...)\` 리스너 하나만 등록하여 모든 실시간 데이터를 수신합니다.
  - 🇺🇸 All clients (General, Guest, and Admin) should use a single listener: \`socket.on('event', ...)\` to receive all real-time data.

### 🔐 Auth & Connection (인증 및 연결)
- **Cookie-based Auth (쿠키 인증)**
  - 🇰🇷 연결 시 HTTP 세션 쿠키를 통해 자동으로 인증이 수행됩니다.
  - 🇺🇸 Handshake is authenticated automatically via HTTP session cookies.
- **Client Config (클라이언트 설정)**
  - 🇰🇷 브라우저 연결 시 \`withCredentials: true\` 옵션 활성화가 필수입니다.
  - 🇺🇸 Must enable \`withCredentials: true\` in socket.io-client configuration.
- **Endpoints (네임스페이스)**
  - 🇰🇷 **일반 유저 및 익명**: \`io(BASE_URL)\` (네임스페이스 생략 시 기본 \`/\` 연결)
  - 🇺🇸 **General User/Guest**: \`io(BASE_URL)\` (Connects to \`/\` by default)
  - 🇰🇷 **관리자**: \`io(BASE_URL + "/admin")\` (주소 뒤에 \`/admin\` 네임스페이스 명시 필수)
  - 🇺🇸 **Admin**: \`io(BASE_URL + "/admin")\` (Must specify \`/admin\` in the connection URL)
- **Connection Rate Limit (연결 제한)**
  - 🇰🇷 보안 및 안정성을 위해 **IP당 10초당 최대 120회**의 연결 시도만 허용됩니다. (초과 시 거부)
  - 🇺🇸 For security and stability, a maximum of **120 connection attempts per 10 seconds per IP** is allowed.
- **Access Control (권한 제어)**
  - 🇰🇷 관리자 권한이 없는 세션이 \`/admin\`으로 연결을 시도할 경우 즉시 차단됩니다.
  - 🇺🇸 Sessions without admin privileges will be disconnected immediately from \`/admin\`.
          `,
          )
          .setVersion('1.0')
          .setDefaultContentType('application/json')
          .addServer('local', {
            url: `ws://localhost:${envService.app.port}`,
            protocol: 'socket.io',
            protocolVersion: '4',
          })
          .build();

        const asyncapiDocument = await DynamicAsyncApiModule.createDocument(
          app,
          asyncApiOptions,
        );
        await DynamicAsyncApiModule.setup('async', app, asyncapiDocument);
      }
    }

    const logger = app.get(Logger);

    // Graceful shutdown 처리
    const schedulerRegistry = app.get(SchedulerRegistry);

    const shutdown = async (signal: string) => {
      logger.log(`${signal} 시그널을 받았습니다. 애플리케이션을 종료합니다...`);

      // 모든 크론 작업 중지
      try {
        const cronJobs = schedulerRegistry.getCronJobs();
        cronJobs.forEach((job, name) => {
          job.stop();
          logger.log(`크론 작업 중지: ${name}`);
        });
      } catch (error) {
        logger.error(`크론 작업 중지 중 오류 발생: ${error}`);
      }

      // 애플리케이션 종료
      await app.close();
      logger.log('애플리케이션이 종료되었습니다.');
      process.exit(0);
    };

    // 종료 시그널 처리
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    await app.listen(envService.app.port);
    logger.log(`애플리케이션이 포트 ${envService.app.port}에서 실행 중입니다.`);
  } catch (error) {
    console.error('애플리케이션 시작 중 오류가 발생했습니다:', error);
    process.exit(1);
  }
}

const unlessAdmin = (middleware) => (req, res, next) => {
  if (req.path.startsWith('/admin')) {
    return next();
  }
  middleware(req, res, next);
};

bootstrap();
