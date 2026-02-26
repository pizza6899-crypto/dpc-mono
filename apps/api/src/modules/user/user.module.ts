// src/modules/user/user.module.ts
import { Module } from '@nestjs/common';
import { CreateUserService } from './application/create-user.service';
import { ListUsersService } from './application/list-users.service';
import { GetUserService } from './application/get-user.service';
import { UpdateUserAdminService } from './application/update-user-admin.service';
import { UserRepository } from './infrastructure/user.repository';
import { UserMapper } from './infrastructure/user.mapper';
import { USER_REPOSITORY } from './ports/out/user.repository.token';
import { UserAdminController } from './controllers/admin/user-admin.controller';

@Module({
  imports: [],
  providers: [
    CreateUserService,
    ListUsersService,
    GetUserService,
    UpdateUserAdminService,
    UserMapper,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
  controllers: [UserAdminController],
  exports: [
    CreateUserService,
    ListUsersService,
    GetUserService,
    UpdateUserAdminService,
    USER_REPOSITORY,
  ],
})
export class UserModule { }
