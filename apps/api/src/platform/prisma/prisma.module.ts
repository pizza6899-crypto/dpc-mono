import { Global, Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { PrismaService } from './prisma.service';
import { EnvService } from '../env/env.service';

@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      plugins: [
        new ClsPluginTransactional({
          imports: [],
          adapter: new TransactionalAdapterPrisma({
            prismaInjectionToken: PrismaService,
            sqlFlavor: 'postgresql',
          }),
          enableTransactionProxy: true,
        }),
      ],
    }),
  ],
  providers: [PrismaService, EnvService],
  exports: [PrismaService, ClsModule],
})
export class PrismaModule { }
