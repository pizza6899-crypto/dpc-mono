import { Module } from '@nestjs/common';
import { AffiliateReferralModule } from '../affiliate/referral/referral.module';
import { CredentialModule } from './credential/credential.module';
import { RegistrationModule } from './registration/registration.module';
import { CaslModule } from './casl/casl.module';
import { SessionModule } from './session/session.module';

@Module({
  imports: [
    AffiliateReferralModule, // 레퍼럴 서비스 사용을 위해 추가
    CredentialModule, // 하위 자격 증명 모듈 추가
    RegistrationModule, // 하위 회원가입 모듈 추가
    CaslModule, // CASL 권한 관리 모듈 추가
    SessionModule, // 세션 모듈 추가
  ],
  providers: [
  ],
  exports: [],
})
export class AuthModule {}
