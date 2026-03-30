import { Global, Module } from '@nestjs/common';
import { SqidsService } from './sqids.service';
import { EnvModule } from 'src/common/env/env.module';
import { SqidsAdminController } from './controllers/admin/sqids-admin.controller';

@Global()
@Module({
  imports: [EnvModule],
  controllers: [SqidsAdminController],
  providers: [SqidsService],
  exports: [SqidsService],
})
export class SqidsModule { }
