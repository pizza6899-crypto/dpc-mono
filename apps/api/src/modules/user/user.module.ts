// src/modules/user/user.module.ts
import { Module } from '@nestjs/common';
import { UserProfileModule } from './profile/user-profile.module';
import { UserAccountModule } from './account/user-account.module';
import { UserConfigModule } from './config/user-config.module';

@Module({
  imports: [UserProfileModule, UserAccountModule, UserConfigModule],
  exports: [UserProfileModule, UserAccountModule, UserConfigModule],
})
export class UserModule {}
