import { Module } from '@nestjs/common';
import { CredentialModule } from './credential/credential.module';
import { AuthManagementModule } from './management/auth-management.module';
import { AuthPasswordModule } from './password/auth-password.module';
import { SessionModule } from './session/session.module';
import { PhoneVerificationModule } from './phone-verification/phone-verification.module';

@Module({
  imports: [
    CredentialModule, // 하위 자격 증명 모듈 추가
    AuthManagementModule, // 관리자용 인증 관리 모듈 추가
    AuthPasswordModule, // 비밀번호 관리 모듈 추가
    SessionModule, // 세션 모듈 추가
    PhoneVerificationModule, // 휴대폰 인증 모듈 추가
  ],
  providers: [],
  exports: [],
})
export class AuthModule { }
