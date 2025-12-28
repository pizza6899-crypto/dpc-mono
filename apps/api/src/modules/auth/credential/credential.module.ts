import { Module } from '@nestjs/common';
import { CredentialUserController } from './controllers/user/credential-user.controller';
import { CredentialAdminController } from './controllers/admin/credential-admin.controller';
import { LoginService } from './application/login.service';
import { LogoutService } from './application/logout.service';
import { RecordLoginAttemptService } from './application/record-login-attempt.service';
import { FindLoginAttemptsService } from './application/find-login-attempts.service';
import { LOGIN_ATTEMPT_REPOSITORY } from './ports/login-attempt.repository.token';
import { LoginAttemptRepository } from './infrastructure/repository';
import { LoginAttemptMapper } from './infrastructure/mapper';
import { CredentialPolicy } from './domain/policy';
import { CredentialLocalStrategy } from './infrastructure/strategies/local.strategy';
import { CredentialAdminLocalStrategy } from './infrastructure/strategies/admin-local.strategy';
import { AuthService } from '../application/auth.service';
import { VipModule } from '../../vip/vip.module';
import { AffiliateReferralModule } from '../../affiliate/referral/referral.module';

@Module({
  imports: [VipModule, AffiliateReferralModule],
  controllers: [CredentialUserController, CredentialAdminController],
  providers: [
    // Application Services
    LoginService,
    LogoutService,
    RecordLoginAttemptService,
    FindLoginAttemptsService,

    // Domain Policies
    CredentialPolicy,

    // Infrastructure
    LoginAttemptMapper,
    {
      provide: LOGIN_ATTEMPT_REPOSITORY,
      useClass: LoginAttemptRepository,
    },

    // Strategies
    CredentialLocalStrategy,
    CredentialAdminLocalStrategy,

    // Shared Services (참조용)
    AuthService,
  ],
  exports: [LoginService, LogoutService],
})
export class CredentialModule {}
