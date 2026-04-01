import { Global, Module } from '@nestjs/common';
import { PrismaService, EXTENDED_PRISMA_CLIENT, type PrismaTransaction } from './prisma.service';
export type { PrismaTransaction };
import { CustomClsModule } from '../cls/cls.module';

@Global()
@Module({
  imports: [
    CustomClsModule, // 독립된 CLS 모듈로 위임
  ],
  providers: [
    PrismaService,
    {
      provide: EXTENDED_PRISMA_CLIENT,
      useFactory: (prismaService: PrismaService) => {
        return prismaService.extended;
      },
      inject: [PrismaService],
    },
  ],
  exports: [PrismaService, EXTENDED_PRISMA_CLIENT, CustomClsModule],
})
export class PrismaModule { }
