import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        // 1. 환경별 로그 레벨 설정
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',

        // 2. Request ID 생성 및 전파
        genReqId: (req) => {
          // 이미 클라이언트나 앞단(Cloudflare 등)에서 보낸 ID가 있다면 재사용, 없으면 생성
          return req.headers['x-request-id'] || randomUUID();
        },

        // 3. 응답 헤더에 Request ID 주입 (디버깅 편의성)
        // Note: nestjs-pino는 자동으로 req.id를 로그에 포함하지만,
        // 응답 헤더에 추가하려면 별도 미들웨어나 인터셉터가 필요합니다.
        // 여기서는 genReqId로 생성된 ID가 req.id에 자동 할당됩니다.

        // 4. 로깅 제외 경로 (헬스체크 등)
        autoLogging: {
          ignore: (req) => req.url?.startsWith('/health') ?? false,
        },

        // 5. HTTP 상태 코드에 따른 로그 레벨 최적화
        customLogLevel: (req, res, err) => {
          if (res.statusCode >= 400 && res.statusCode < 500) return 'warn';
          if (res.statusCode >= 500 || err) return 'error';
          return 'info';
        },

        // 6. 로그 시리얼라이저 (필요한 정보만 추출하여 저장 공간 절약)
        serializers: {
          req: (req: any) => ({
            id: req.id,
            method: req.method,
            url: req.url,
            // Cloudflare를 사용한다면 실제 IP 추출을 위해 헤더 확인 필요
            ip: req.headers['cf-connecting-ip'] || req.remoteAddress,
            // 세션/유저 정보 추가
            userId: req.user?.id || 'anonymous',
            sessionId: req.sessionID || 'none',
          }),
          res: (res) => ({
            statusCode: res.statusCode,
          }),
          err: (err) => ({
            type: err?.type || err?.name || 'Error',
            message: err?.message || 'Unknown error',
            stack: err?.stack,
          }),
        },

        // 7. 개발 환경 가독성 (pino-pretty)
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  levelFirst: true,
                  translateTime: 'SYS:standard',
                  ignore: 'pid,hostname', // 로컬 개발 시 불필요한 정보 제거
                },
              }
            : undefined,

        // 9. 보안 - 민감 정보 마스킹
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.refreshToken',
            'res.headers["set-cookie"]',
          ],
        },
      },
    }),
  ],
})
export class CommonLoggerModule {}
