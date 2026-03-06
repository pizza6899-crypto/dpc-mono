// src/modules/user/profile/user-profile.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { SessionModule } from 'src/modules/auth/session/session.module';
import { UserConfigModule } from '../config/user-config.module';
import { FileModule } from 'src/modules/file/file.module';
import { CasinoSessionModule } from 'src/modules/casino-session/game-session.module';
import { AlertModule } from 'src/modules/notification/alert/alert.module';
import { CreateUserService } from './application/create-user.service';
import { ListUsersService } from './application/list-users.service';
import { GetUserService } from './application/get-user.service';
import { GetMyProfileService } from './application/get-my-profile.service';
import { UpdateMyProfileService } from './application/update-my-profile.service';
import { UpdateMyNicknameService } from './application/update-my-nickname.service';
import { UpdateMyAvatarService } from './application/update-my-avatar.service';
import { ChangeMyPasswordService } from './application/change-my-password.service';
import { UpdateUserAdminService } from './application/update-user-admin.service';
import { CloseUserAdminService } from './application/close-user-admin.service';
import { RestoreUserAdminService } from './application/restore-user-admin.service';
import { UpdateMyCurrencyService } from './application/update-my-currency.service';
import { UpdateVerifiedPhoneService } from './application/update-verified-phone.service';
import { UserRepository } from './infrastructure/user.repository';
import { UserMapper } from './infrastructure/user.mapper';
import { USER_REPOSITORY } from './ports/out/user.repository.token';
import { UserAdminController } from './controllers/admin/user-admin.controller';
import { UserProfileController } from './controllers/user/user-profile.controller';
import { EnvModule } from 'src/common/env/env.module';

@Module({
    imports: [SessionModule, UserConfigModule, FileModule, EnvModule, CasinoSessionModule, AlertModule],
    providers: [
        CreateUserService,
        ListUsersService,
        GetUserService,
        GetMyProfileService,
        UpdateMyProfileService,
        UpdateMyNicknameService,
        UpdateMyAvatarService,
        ChangeMyPasswordService,
        UpdateUserAdminService,
        CloseUserAdminService,
        RestoreUserAdminService,
        UpdateMyCurrencyService,
        UpdateVerifiedPhoneService,
        UserMapper,
        {
            provide: USER_REPOSITORY,
            useClass: UserRepository,
        },
    ],
    controllers: [UserAdminController, UserProfileController],
    exports: [
        CreateUserService,
        ListUsersService,
        GetUserService,
        GetMyProfileService,
        UpdateMyProfileService,
        UpdateMyNicknameService,
        UpdateMyAvatarService,
        ChangeMyPasswordService,
        UpdateUserAdminService,
        CloseUserAdminService,
        RestoreUserAdminService,
        UpdateMyCurrencyService,
        UpdateVerifiedPhoneService,
        USER_REPOSITORY,
    ],
})
export class UserProfileModule { }
