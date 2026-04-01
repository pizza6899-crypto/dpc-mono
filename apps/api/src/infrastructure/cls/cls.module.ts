import { Global, Module, forwardRef } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { EXTENDED_PRISMA_CLIENT } from '../prisma/prisma.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RequestContextService } from './request-context.service';

/**
 * [ClsModule] 전역 요청 컨텍스트 (Correlation ID, Context Sync, Prisma Transaction)
 *
 * pino-http의 req.id와 동기화된 traceId를 제공하고,
 * Prisma의 비즈니스 트랜잭션(@Transactional)을 지원합니다.
 */
@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        // [핵심] pino-http에서 생성한 req.id를 CLS ID로 동기화
        setup: (cls, req: any) => {
          cls.set('id', req.id);
        },
      },
      plugins: [
        new ClsPluginTransactional({
          imports: [forwardRef(() => PrismaModule)],
          adapter: new TransactionalAdapterPrisma({
            prismaInjectionToken: EXTENDED_PRISMA_CLIENT,
            sqlFlavor: 'postgresql',
          }),
          enableTransactionProxy: true,
        }),
      ],
    }),
  ],
  providers: [RequestContextService],
  exports: [ClsModule, RequestContextService],
})
export class CustomClsModule { }
