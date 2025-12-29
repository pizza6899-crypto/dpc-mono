// src/modules/user/user.module.ts
import { Module } from '@nestjs/common';
import { CreateUserService } from './application/create-user.service';
import { UserRepository } from './infrastructure/user.repository';
import { UserMapper } from './infrastructure/user.mapper';
import { USER_REPOSITORY } from './ports/out/user.repository.token';

@Module({
  imports: [
  ],
  providers: [
    CreateUserService,
    UserMapper,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
  controllers: [],
  exports: [
    CreateUserService,
    USER_REPOSITORY, // registration 모듈에서 사용
  ],
})
export class UserModule {}

