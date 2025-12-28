import { Module } from '@nestjs/common';
import { AuthController } from './controllers/http/auth.controller';
import { ProfileController } from './controllers/http/profile.controller';
import { SocialAuthController } from './controllers/http/social-auth.controller';
import { PasswordController } from './controllers/http/password.controller';
import { EnvModule } from '../../platform/env/env.module';
import { AuthService } from './application/auth.service';
import { ProfileService } from './application/profile.service';
import { SocialAuthService } from './application/social-auth.service';
import { PrismaModule } from 'src/platform/prisma/prisma.module';
import { ActivityLogModule } from 'src/platform/activity-log/activity-log.module';
import { GoogleStrategy } from 'src/platform/auth/strategies/google.strategy';
import { QueueModule } from 'src/platform/queue/queue.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from 'src/platform/auth/strategies/local.strategy';
import { SessionSerializer } from 'src/platform/auth/strategies/session.serializer';
import { VipModule } from '../vip/vip.module';
import { AdminAuthController } from './controllers/http/admin.controller';
import { AdminLocalStrategy } from 'src/platform/auth/strategies/admin-local.strategy';
import { AdminLocalAuthGuard } from 'src/platform/auth/guards/admin-local-auth.guard';
import { PasswordService } from './application/password.service';
import { MailModule } from 'src/platform/mail/mail.module';
import { SessionModule } from 'src/platform/session/session.module';
import { AffiliateReferralModule } from '../affiliate/referral/referral.module';
import { CredentialModule } from './credential/credential.module';

@Module({
  imports: [
    PassportModule.register({ session: true }),
    EnvModule,
    PrismaModule,
    ActivityLogModule,
    QueueModule,
    VipModule,
    MailModule,
    SessionModule,
    AffiliateReferralModule, // 레퍼럴 서비스 사용을 위해 추가
    CredentialModule, // 하위 자격 증명 모듈 추가
  ],
  controllers: [
    AuthController,
    ProfileController,
    SocialAuthController,
    AdminAuthController,
    PasswordController,
  ],
  providers: [
    LocalStrategy,
    AdminLocalStrategy,
    GoogleStrategy,
    SessionSerializer,
    AuthService,
    ProfileService,
    SocialAuthService,
    AdminLocalAuthGuard,
    PasswordService,
  ],
  exports: [PassportModule],
})
export class AuthModule {}
