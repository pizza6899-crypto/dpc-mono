import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { CreateAdminMemoService } from './application/create-admin-memo.service';
import { FindAdminMemoService } from './application/find-admin-memo.service';
import { AdminMemoMapper } from './infrastructure/admin-memo.mapper';
import { PrismaAdminMemoRepository } from './infrastructure/prisma-admin-memo.repository';
import { ADMIN_MEMO_REPOSITORY } from './ports/out';
import { AdminMemoAdminController } from './controllers/admin/admin-memo-admin.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AdminMemoAdminController],
  providers: [
    CreateAdminMemoService,
    FindAdminMemoService,
    AdminMemoMapper,
    {
      provide: ADMIN_MEMO_REPOSITORY,
      useClass: PrismaAdminMemoRepository,
    },
  ],
  exports: [CreateAdminMemoService, FindAdminMemoService],
})
export class AdminMemoModule {}
