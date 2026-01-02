import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import compression from 'compression';
import { corsConfig } from './common/security/cors.config';
import { helmetConfig } from './common/security/helmet.config';
import { TransformInterceptor } from './common/http/interceptors/transform.interceptor';
import { CustomValidationPipe } from './common/http/pipes/validation.pipe';
import { EnvService } from './common/env/env.service';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { Reflector } from '@nestjs/core';
import session from 'express-session';
import passport from 'passport';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Prisma } from '@repo/database';
import { AsyncApiModule } from 'nestjs-asyncapi';
import { AsyncApiDocumentBuilder } from 'nestjs-asyncapi';

// BigInt JSON 직렬화 설정
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  try {
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
        maxAge: envService.session.maxAge,
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
        maxAge: envService.adminSession.maxAge,
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

    app.useGlobalInterceptors(
      new TransformInterceptor(app.get(Reflector)),
    );
    app.useGlobalPipes(new CustomValidationPipe());

    // 정적 파일 서빙 설정 추가
    app.useStaticAssets(join(process.cwd(), 'public'), {
      prefix: '/static',
    });

    if (isDevelopment) {
      const config = new DocumentBuilder()
        .setTitle('DPC Backend API')
        .setDescription('DPC Backend API 문서')
        .setVersion('1.0')
        .addCookieAuth(envService.session.name)
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api', app, document);

      const asyncApiOptions = new AsyncApiDocumentBuilder()
        .setTitle('DPC Backend WebSocket API')
        .setDescription('DPC Backend WebSocket 이벤트 문서')
        .setVersion('1.0')
        .setDefaultContentType('application/json')
        .addServer('local', {
          url: `ws://localhost:${envService.app.port}`,
          protocol: 'socket.io',
          protocolVersion: '4',
          description: 'DPC Backend WebSocket Server',
        })
        .build();

      const asyncapiDocument = await AsyncApiModule.createDocument(
        app,
        asyncApiOptions,
      );
      await AsyncApiModule.setup('async', app, asyncapiDocument);
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
