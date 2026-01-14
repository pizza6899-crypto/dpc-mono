import { Module, Global } from '@nestjs/common';
import { StorageService } from './storage.service';
import { EnvModule } from 'src/common/env/env.module';

@Global()
@Module({
    imports: [EnvModule],
    providers: [StorageService],
    exports: [StorageService],
})
export class StorageModule { }
