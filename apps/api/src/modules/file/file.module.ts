import { Module } from '@nestjs/common';
import { EnvModule } from 'src/common/env/env.module';
import { FileController } from './controllers/file.controller';
import { CreateFileService } from './application/create-file.service';
import { FindFileService } from './application/find-file.service';
import { AttachFileService } from './application/attach-file.service';
import { DetachFileService } from './application/detach-file.service';
import { FileRepository } from './infrastructure/file.repository';
import { FileUsageRepository } from './infrastructure/file-usage.repository';
import { FileMapper } from './infrastructure/file.mapper';
import { FileUsageMapper } from './infrastructure/file-usage.mapper';
import { FILE_REPOSITORY } from './ports/file.repository.token';
import { FILE_USAGE_REPOSITORY } from './ports/file-usage.repository.token';

@Module({
    imports: [EnvModule],
    controllers: [FileController],
    providers: [
        CreateFileService,
        FindFileService,
        AttachFileService,
        DetachFileService,
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
    exports: [
        CreateFileService,
        FindFileService,
        AttachFileService,
        DetachFileService
    ],
})
export class FileModule { }
