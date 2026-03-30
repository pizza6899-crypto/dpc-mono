import { Module } from '@nestjs/common';
import { UserAuthController } from './controllers/user/user-auth.controller';
import { AdminAuthController } from './controllers/admin/admin-auth.controller';
import { AuthenticateIdentityService } from './application/authenticate-identity.service';
import { LoginService } from './application/login.service';
import { LogoutService } from './application/logout.service';
import { RecordLoginAttemptService } from './application/record-login-attempt.service';
import { VerifyCredentialService } from './application/verify-credential.service';
import { LoginAttemptRepository } from './infrastructure/login-attempt.repository';
import { CredentialUserRepository } from './infrastructure/credential-user.repository';
import { LoginAttemptMapper } from './infrastructure/login-attempt.mapper';
import { CredentialUserMapper } from './infrastructure/credential-user.mapper';
import { CredentialPolicy } from './domain/policy';
import { AffiliateReferralModule } from '../../affiliate/referral/referral.module';
import { UserProfileModule } from '../../user/profile/user-profile.module';
import { CheckUserStatusService } from './application/check-user-status.service';
import {
  LOGIN_ATTEMPT_REPOSITORY,
  CREDENTIAL_USER_REPOSITORY,
} from './ports/out';
import { SessionModule } from '../session/session.module';
import { EnvModule } from 'src/infrastructure/env/env.module';
import { PassportModule } from '@nestjs/passport';
import { SessionSerializer } from 'src/common/auth/strategies/session.serializer';

@Module({
  imports: [
    PassportModule.register({ session: true }),
    EnvModule, // LoginService가 EnvService를 사용하기 위해 필요
    AffiliateReferralModule,
    UserProfileModule, // UserRepository 사용을 위해 필요
    SessionModule, // CreateSessionService 사용을 위해 필요
  ],
  controllers: [UserAuthController, AdminAuthController],
  providers: [
    // Application Services
    AuthenticateIdentityService,
    LoginService,
    LogoutService,
    RecordLoginAttemptService,
    VerifyCredentialService,
    CheckUserStatusService,

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

    SessionSerializer,
  ],
  exports: [
    PassportModule,
    LoginService,
    LogoutService,
    VerifyCredentialService,
    LOGIN_ATTEMPT_REPOSITORY,
    CREDENTIAL_USER_REPOSITORY,
  ],
})
export class CredentialModule {}
