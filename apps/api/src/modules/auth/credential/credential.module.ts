import { Module } from '@nestjs/common';
import { CredentialUserController } from './controllers/user/credential-user.controller';
import { CredentialAdminController } from './controllers/admin/credential-admin.controller';
import { AuthenticateCredentialService } from './application/authenticate-credential.service';
import { AuthenticateCredentialAdminService } from './application/authenticate-credential-admin.service';
import { LoginService } from './application/login.service';
import { LogoutService } from './application/logout.service';
import { RecordLoginAttemptService } from './application/record-login-attempt.service';
import { FindLoginAttemptsService } from './application/find-login-attempts.service';
import { VerifyCredentialService } from './application/verify-credential.service';
import {
  LOGIN_ATTEMPT_REPOSITORY,
  CREDENTIAL_USER_REPOSITORY,
} from './ports/out';
import { LoginAttemptRepository } from './infrastructure/login-attempt.repository';
import { CredentialUserRepository } from './infrastructure/credential-user.repository';
import { LoginAttemptMapper } from './infrastructure/mapper';
import { CredentialUserMapper } from './infrastructure/credential-user.mapper';
import { CredentialPolicy } from './domain/policy';
import { VipModule } from '../../vip/vip.module';
import { AffiliateReferralModule } from '../../affiliate/referral/referral.module';
import { ActivityLogModule } from 'src/platform/activity-log/activity-log.module';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from '../../user/user.module';
import { ChangePasswordService } from './application/change-password.service';
import { ResetUserPasswordAdminService } from './application/reset-user-password-admin.service';

@Module({
  imports: [
    PassportModule.register({ session: true }),
    VipModule,
    AffiliateReferralModule,
    ActivityLogModule,
    UserModule, // UserRepository 사용을 위해 필요
  ],
  controllers: [CredentialUserController, CredentialAdminController],
  providers: [
    // Application Services
    AuthenticateCredentialService,
    AuthenticateCredentialAdminService,
    LoginService,
    LogoutService,
    RecordLoginAttemptService,
    FindLoginAttemptsService,
    VerifyCredentialService,
    ChangePasswordService,
    ResetUserPasswordAdminService,

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
  ],
  exports: [LoginService, LogoutService, VerifyCredentialService],
})
export class CredentialModule {}
