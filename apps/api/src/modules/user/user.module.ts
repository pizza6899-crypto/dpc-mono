// src/modules/user/user.module.ts
import { Module } from '@nestjs/common';
import { CreateUserService } from './application/create-user.service';
import { ListUsersService } from './application/list-users.service';
import { UserRepository } from './infrastructure/user.repository';
import { UserMapper } from './infrastructure/user.mapper';
import { USER_REPOSITORY } from './ports/out/user.repository.token';
import { UserAdminController } from './controllers/admin/user-admin.controller';

@Module({
  imports: [],
  providers: [
    CreateUserService,
    ListUsersService,
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
    USER_REPOSITORY, // registration 모듈에서 사용
  ],
})
export class UserModule {}

