import { Module } from '@nestjs/common';
import { GetUserConfigService } from './application/get-user-config.service';
import { UpdateUserConfigAdminService } from './application/update-user-config-admin.service';
import { UserConfigRepository } from './infrastructure/user-config.repository';
import { USER_CONFIG_REPOSITORY } from './ports/out/user-config.repository.token';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';
import { UserConfigAdminController } from './controllers/admin/user-config-admin.controller';

@Module({
  imports: [ConcurrencyModule],
  controllers: [UserConfigAdminController],
  providers: [
    GetUserConfigService,
    UpdateUserConfigAdminService,
    {
      provide: USER_CONFIG_REPOSITORY,
      useClass: UserConfigRepository,
    },
  ],
  exports: [
    USER_CONFIG_REPOSITORY,
    GetUserConfigService,
    UpdateUserConfigAdminService,
  ],
})
export class UserConfigModule {}
