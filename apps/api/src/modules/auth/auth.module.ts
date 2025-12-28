import { Module } from '@nestjs/common';
import { EnvModule } from '../../platform/env/env.module';
import { PrismaModule } from 'src/platform/prisma/prisma.module';
import { ActivityLogModule } from 'src/platform/activity-log/activity-log.module';
import { GoogleStrategy } from 'src/platform/auth/strategies/google.strategy';
import { QueueModule } from 'src/platform/queue/queue.module';
import { PassportModule } from '@nestjs/passport';
import { SessionSerializer } from 'src/platform/auth/strategies/session.serializer';
import { VipModule } from '../vip/vip.module';
import { MailModule } from 'src/platform/mail/mail.module';
import { SessionModule } from 'src/platform/session/session.module';
import { AffiliateReferralModule } from '../affiliate/referral/referral.module';
import { CredentialModule } from './credential/credential.module';
import { RegistrationModule } from './registration/registration.module';

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
    RegistrationModule, // 하위 회원가입 모듈 추가
  ],
  providers: [
    GoogleStrategy,
    SessionSerializer,
  ],
  exports: [PassportModule],
})
export class AuthModule {}
