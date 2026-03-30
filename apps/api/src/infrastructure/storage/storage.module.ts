import { Module, Global } from '@nestjs/common';
import { StorageService } from './storage.service';
import { EnvModule } from 'src/infrastructure/env/env.module';

@Global()
@Module({
  imports: [],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
