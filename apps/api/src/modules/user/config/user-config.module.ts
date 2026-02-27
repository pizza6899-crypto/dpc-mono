import { Module } from '@nestjs/common';
import { GetUserConfigService } from './application/get-user-config.service';
import { UpdateUserConfigAdminService } from './application/update-user-config-admin.service';
import { UserConfigRepository } from './infrastructure/user-config.repository';
import { USER_CONFIG_REPOSITORY } from './ports/out/user-config.repository.token';
import { UserConfigAdminController } from './controllers/admin/user-config-admin.controller';

@Module({
    controllers: [UserConfigAdminController],
    providers: [
        GetUserConfigService,
        UpdateUserConfigAdminService,
        {
            provide: USER_CONFIG_REPOSITORY,
            useClass: UserConfigRepository,
        },
    ],
    exports: [USER_CONFIG_REPOSITORY, GetUserConfigService, UpdateUserConfigAdminService],
})
export class UserConfigModule { }
