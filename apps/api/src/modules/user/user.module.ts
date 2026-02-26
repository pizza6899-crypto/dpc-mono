// src/modules/user/user.module.ts
import { Module } from '@nestjs/common';
import { UserProfileModule } from './profile/user-profile.module';
import { UserAccountModule } from './account/user-account.module';

@Module({
  imports: [UserProfileModule, UserAccountModule],
  exports: [UserProfileModule, UserAccountModule],
})
export class UserModule { }
