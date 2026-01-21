import { Global, Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import type { Transaction } from '@nestjs-cls/transactional';
import { PrismaService, type ExtendedClient } from './prisma.service';
import type { PrismaClient } from '@prisma/client';

// Transaction 어댑터 타입 정의
export type PrismaTransactionalAdapter = TransactionalAdapterPrisma<ExtendedClient>;

// Transaction 타입 정의 (Repository에서 사용)
export type PrismaTransaction = Transaction<PrismaTransactionalAdapter>;

// 확장된 Prisma Client를 위한 주입 토큰
export const EXTENDED_PRISMA_CLIENT = Symbol('EXTENDED_PRISMA_CLIENT');

@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      plugins: [
        new ClsPluginTransactional({
          imports: [],
          adapter: new TransactionalAdapterPrisma<ExtendedClient>({
            prismaInjectionToken: EXTENDED_PRISMA_CLIENT,
            sqlFlavor: 'postgresql',
          }),
          enableTransactionProxy: true,
        }),
      ],
    }),
  ],
  providers: [
    PrismaService,
    {
      provide: EXTENDED_PRISMA_CLIENT,
      useFactory: (prismaService: PrismaService) => {
        // 앱 초기화 시점에 extended 클라이언트가 준비되어 있어야 함
        // PrismaService의 onModuleInit가 호출된 후여야 하므로, 
        // 안전하게 getter를 사용하거나, PrismaService 생성자에서 초기화하도록 변경 고려 필요
        // 현재는 getter 사용
        return prismaService.extended;
      },
      inject: [PrismaService],
    },
  ],
  exports: [PrismaService, ClsModule, EXTENDED_PRISMA_CLIENT],
})
export class PrismaModule { }