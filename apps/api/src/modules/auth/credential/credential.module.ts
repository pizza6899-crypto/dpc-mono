import { Module } from '@nestjs/common';
import { CredentialUserController } from './controllers/user/credential-user.controller';
import { CredentialAdminController } from './controllers/admin/credential-admin.controller';
import { LoginService } from './application/login.service';
import { LogoutService } from './application/logout.service';
import { RecordLoginAttemptService } from './application/record-login-attempt.service';
import { FindLoginAttemptsService } from './application/find-login-attempts.service';
import { VerifyCredentialService } from './application/verify-credential.service';
import {
  LOGIN_ATTEMPT_REPOSITORY,
  CREDENTIAL_USER_REPOSITORY,
} from './ports/out';
import { LoginAttemptRepository } from './infrastructure/repository';
import { CredentialUserRepository } from './infrastructure/credential-user.repository';
import { LoginAttemptMapper } from './infrastructure/mapper';
import { CredentialUserMapper } from './infrastructure/credential-user.mapper';
import { CredentialPolicy } from './domain/policy';
import { CredentialLocalStrategy } from './infrastructure/strategies/local.strategy';
import { CredentialAdminLocalStrategy } from './infrastructure/strategies/admin-local.strategy';
import { VipModule } from '../../vip/vip.module';
import { AffiliateReferralModule } from '../../affiliate/referral/referral.module';
import { ActivityLogModule } from 'src/platform/activity-log/activity-log.module';

@Module({
  imports: [VipModule, AffiliateReferralModule, ActivityLogModule],
  controllers: [CredentialUserController, CredentialAdminController],
  providers: [
    // Application Services
    LoginService,
    LogoutService,
    RecordLoginAttemptService,
    FindLoginAttemptsService,
    VerifyCredentialService,

    // Domain Policies
    CredentialPolicy,

    // Infrastructure
    LoginAttemptMapper,
    CredentialUserMapper,
    {
      provide: LOGIN_ATTEMPT_REPOSITORY,
      useClass: LoginAttemptRepository,
    },
    {
      provide: CREDENTIAL_USER_REPOSITORY,
      useClass: CredentialUserRepository,
    },

    // Strategies
    CredentialLocalStrategy,
    CredentialAdminLocalStrategy,
  ],
  exports: [LoginService, LogoutService, VerifyCredentialService],
})
export class CredentialModule {}
