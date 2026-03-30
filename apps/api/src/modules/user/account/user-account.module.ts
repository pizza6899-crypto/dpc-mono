import { Module } from '@nestjs/common';
import { AffiliateCodeModule } from '../../affiliate/code/code.module';
import { AffiliateReferralModule } from '../../affiliate/referral/referral.module';
import { AuditLogModule } from 'src/modules/audit-log/audit-log.module';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/infrastructure/env/env.module';
import { UserProfileModule } from '../profile/user-profile.module';
import { UserConfigModule } from '../config/user-config.module';
import { ThrottleModule } from 'src/infrastructure/throttle/throttle.module';
import { UserAccountController } from './controllers/user/account.controller';
import { UserAccountAdminController } from './controllers/admin/account-admin.controller';
import { RegisterUserService } from './application/register-user.service';
import { RegisterSocialUserService } from './application/register-social-user.service';
import { RegisterAdminService } from './application/register-admin.service';
import { CheckAvailabilityService } from './application/check-availability.service';
import { RegistrationLimitGuard } from './guards/registration-limit.guard';

@Module({
  imports: [
    PrismaModule,
    EnvModule,
    UserProfileModule,
    UserConfigModule,
    ThrottleModule,
    AffiliateCodeModule,
    AffiliateReferralModule,
    AuditLogModule,
  ],
  controllers: [UserAccountController, UserAccountAdminController],
  providers: [
    RegisterUserService,
    RegisterSocialUserService,
    RegisterAdminService,
    CheckAvailabilityService,
    RegistrationLimitGuard,
  ],
  exports: [
    RegisterUserService,
    RegisterSocialUserService,
    RegisterAdminService,
  ],
})
export class UserAccountModule {}
