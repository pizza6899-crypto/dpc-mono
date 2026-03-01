// src/modules/user/profile/user-profile.module.ts
import { Module } from '@nestjs/common';
import { SessionModule } from 'src/modules/auth/session/session.module';
import { CreateUserService } from './application/create-user.service';
import { ListUsersService } from './application/list-users.service';
import { GetUserService } from './application/get-user.service';
import { GetMyProfileService } from './application/get-my-profile.service';
import { UpdateMyProfileService } from './application/update-my-profile.service';
import { UpdateUserAdminService } from './application/update-user-admin.service';
import { UserRepository } from './infrastructure/user.repository';
import { UserMapper } from './infrastructure/user.mapper';
import { USER_REPOSITORY } from './ports/out/user.repository.token';
import { UserAdminController } from './controllers/admin/user-admin.controller';
import { UserProfileController } from './controllers/user/user-profile.controller';

@Module({
    imports: [SessionModule],
    providers: [
        CreateUserService,
        ListUsersService,
        GetUserService,
        GetMyProfileService,
        UpdateMyProfileService,
        UpdateUserAdminService,
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
        UpdateUserAdminService,
        USER_REPOSITORY,
    ],
})
export class UserProfileModule { }
