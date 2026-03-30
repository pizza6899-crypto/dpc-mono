import { Global, Module } from '@nestjs/common';
import { SqidsService } from './sqids.service';
import { EnvModule } from 'src/infrastructure/env/env.module';
import { SqidsAdminController } from './controllers/admin/sqids-admin.controller';

@Global()
@Module({
  imports: [],
  controllers: [SqidsAdminController],
  providers: [SqidsService],
  exports: [SqidsService],
})
export class SqidsModule { }
