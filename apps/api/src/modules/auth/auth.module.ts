import { Module } from '@nestjs/common';
import { EnvModule } from '../../common/env/env.module';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { ActivityLogModule } from 'src/common/activity-log/activity-log.module';
import { GoogleStrategy } from 'src/common/auth/strategies/google.strategy';
import { QueueModule } from 'src/infrastructure/queue/queue.module';
import { PassportModule } from '@nestjs/passport';
import { SessionSerializer } from 'src/common/auth/strategies/session.serializer';
import { VipModule } from '../vip/vip.module';
import { AffiliateReferralModule } from '../affiliate/referral/referral.module';
import { CredentialModule } from './credential/credential.module';
import { RegistrationModule } from './registration/registration.module';
import { CaslModule } from './casl/casl.module';
import { SessionModule } from './session/session.module';

@Module({
  imports: [
    PassportModule.register({ session: true }),
    EnvModule,
    PrismaModule,
    ActivityLogModule,
    QueueModule,
    VipModule,
    AffiliateReferralModule, // 레퍼럴 서비스 사용을 위해 추가
    CredentialModule, // 하위 자격 증명 모듈 추가
    RegistrationModule, // 하위 회원가입 모듈 추가
    CaslModule, // CASL 권한 관리 모듈 추가
    SessionModule, // 세션 모듈 추가
  ],
  providers: [
    GoogleStrategy,
    SessionSerializer,
  ],
  exports: [PassportModule, CaslModule],
})
export class AuthModule {}
