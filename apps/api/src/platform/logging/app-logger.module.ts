import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        // 간단한 Request ID 생성
        genReqId: () => crypto.randomUUID(),
        // 헬스체크 등 불필요한 로그 제외
        autoLogging: {
          ignore: (req) => req.url?.startsWith('/health') ?? false,
        },
        // 간결한 로그 메시지 포맷
        customLogLevel: (req, res, err) => {
          if (res.statusCode >= 400 && res.statusCode < 500) return 'warn';
          if (res.statusCode >= 500 || err) return 'error';
          return 'info';
        },
        // 로그에서 불필요한 정보 제거
        serializers: {
          req: (req) => ({
            method: req.method,
            url: req.url,
          }),
          res: (res) => ({
            statusCode: res.statusCode,
          }),
        },
        // 개발환경에서만 pretty 출력
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,
        // 민감 정보 마스킹
        redact: ['req.headers.authorization', 'req.body.password'],
      },
    }),
  ],
})
export class AppLoggerModule {}
