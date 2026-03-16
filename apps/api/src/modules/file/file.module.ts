import { Module } from '@nestjs/common';
import { EnvModule } from 'src/common/env/env.module';
import { FileUserController } from './controllers/user/file-user.controller';
import { FileAdminController } from './controllers/admin/file-admin.controller';
import { CreateFileService } from './application/create-file.service';
import { AttachFileService } from './application/attach-file.service';
import { FileUrlService } from './application/file-url.service';
import { GetFileService } from './application/get-file.service';
import { FileRepository } from './infrastructure/file.repository';
import { FileUsageRepository } from './infrastructure/file-usage.repository';
import { FileMapper } from './infrastructure/file.mapper';
import { FileUsageMapper } from './infrastructure/file-usage.mapper';
import { FILE_REPOSITORY } from './ports/file.repository.token';
import { FILE_USAGE_REPOSITORY } from './ports/file-usage.repository.token';

@Module({
  imports: [EnvModule],
  controllers: [FileUserController, FileAdminController],
  providers: [
    CreateFileService,
    AttachFileService,
    FileUrlService,
    GetFileService,
    FileMapper,
    FileUsageMapper,
    {
      provide: FILE_REPOSITORY,
      useClass: FileRepository,
    },
    {
      provide: FILE_USAGE_REPOSITORY,
      useClass: FileUsageRepository,
    },
  ],
  exports: [CreateFileService, AttachFileService, FileUrlService, GetFileService],
})
export class FileModule { }
