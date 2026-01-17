import { Global, Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import type { Transaction } from '@nestjs-cls/transactional';
import { PrismaService } from './prisma.service';
import type { PrismaClient } from 'src/generated/prisma';

// Transaction 어댑터 타입 정의
export type PrismaTransactionalAdapter = TransactionalAdapterPrisma<PrismaClient>;

// Transaction 타입 정의 (Repository에서 사용)
export type PrismaTransaction = Transaction<PrismaTransactionalAdapter>;

@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      plugins: [
        new ClsPluginTransactional({
          imports: [],
          adapter: new TransactionalAdapterPrisma<PrismaClient>({
            prismaInjectionToken: PrismaService,
            sqlFlavor: 'postgresql',
          }),
          enableTransactionProxy: true,
        }),
      ],
    }),
  ],
  providers: [PrismaService],
  exports: [PrismaService, ClsModule],
})
export class PrismaModule { }