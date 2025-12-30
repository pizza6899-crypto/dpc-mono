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
import { LoginAttemptRepository } from './infrastructure/login-attempt.repository';
import { CredentialUserRepository } from './infrastructure/credential-user.repository';
import { LoginAttemptMapper } from './infrastructure/mapper';
import { CredentialUserMapper } from './infrastructure/credential-user.mapper';
import { CredentialPolicy } from './domain/policy';
import { VipModule } from '../../vip/vip.module';
import { AffiliateReferralModule } from '../../affiliate/referral/referral.module';
import { UserModule } from '../../user/user.module';
import { ChangePasswordService } from './application/change-password.service';
import { ResetUserPasswordAdminService } from './application/reset-user-password-admin.service';
import { RequestPasswordResetService } from './application/request-password-reset.service';
import { ResetPasswordService } from './application/reset-password.service';
import {
  LOGIN_ATTEMPT_REPOSITORY,
  CREDENTIAL_USER_REPOSITORY,
  PASSWORD_RESET_TOKEN_REPOSITORY,
} from './ports/out';
import { PasswordResetTokenRepository } from './infrastructure/password-reset-token.repository';
import { AuditLogModule } from 'src/modules/audit-log/audit-log.module';
import { SessionModule } from '../session/session.module';
import { EnvModule } from 'src/common/env/env.module';
import { PassportModule } from '@nestjs/passport';
import { SessionSerializer } from 'src/common/auth/strategies/session.serializer';

@Module({
  imports: [
    PassportModule.register({ session: true }),
    EnvModule, // LoginService가 EnvService를 사용하기 위해 필요
    VipModule,
    AffiliateReferralModule,
    AuditLogModule,
    UserModule, // UserRepository 사용을 위해 필요
    SessionModule, // CreateSessionService 사용을 위해 필요
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
    RequestPasswordResetService,
    ResetPasswordService,

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
    {
      provide: PASSWORD_RESET_TOKEN_REPOSITORY,
      useClass: PasswordResetTokenRepository,
    },
    
    SessionSerializer,
  ],
  exports: [PassportModule, LoginService, LogoutService, VerifyCredentialService],
})
export class CredentialModule {}
