import { Module } from '@nestjs/common';
import { RegistrationController } from './controllers/user/registration.controller';
import { RegistrationAdminController } from './controllers/admin/registration-admin.controller';
import { RegisterCredentialService } from './application/register-credential.service';
import { RegisterCredentialAdminService } from './application/register-credential-admin.service';
import { RegisterSocialService } from './application/register-social.service';
import { RegistrationPolicy } from './domain';
import { VipModule } from '../../vip/vip.module';
import { AffiliateReferralModule } from '../../affiliate/referral/referral.module';
import { AffiliateCodeModule } from '../../affiliate/code/code.module';
import { ActivityLogModule } from 'src/platform/activity-log/activity-log.module';
import { PrismaModule } from 'src/platform/prisma/prisma.module';
import { EnvModule } from 'src/platform/env/env.module';
import { UserRepository } from './infrastructure/user.repository';
import { UserMapper } from './infrastructure/user.mapper';
import { USER_REPOSITORY } from './ports/out';

@Module({
  imports: [
    PrismaModule,
    EnvModule,
    VipModule,
    AffiliateReferralModule,
    AffiliateCodeModule, // 레퍼럴 코드 사전 검증을 위해 필요
    ActivityLogModule,
  ],
  controllers: [RegistrationController, RegistrationAdminController],
  providers: [
    // Application Services
    RegisterCredentialService,
    RegisterCredentialAdminService,
    RegisterSocialService,

    // Domain Policies
    RegistrationPolicy,

    // Infrastructure
    UserMapper,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
  exports: [RegisterCredentialService, RegisterSocialService],
})
export class RegistrationModule {}
