import { Module } from '@nestjs/common';
import { FileController } from './controllers/file.controller';
import { UploadFileService } from './application/upload-file.service';
import { EnvModule } from 'src/common/env/env.module';

@Module({
    imports: [EnvModule],
    controllers: [FileController],
    providers: [UploadFileService],
})
export class FileModule { }
