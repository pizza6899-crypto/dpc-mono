import { Module } from '@nestjs/common';
import { RegistrationController } from './controllers/user/registration.controller';
import { RegisterCredentialService } from './application/register-credential.service';
import { RegisterSocialService } from './application/register-social.service';
import { RegistrationPolicy } from './domain';
import { VipModule } from '../../vip/vip.module';
import { AffiliateReferralModule } from '../../affiliate/referral/referral.module';
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
    ActivityLogModule,
  ],
  controllers: [RegistrationController],
  providers: [
    // Application Services
    RegisterCredentialService,
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
