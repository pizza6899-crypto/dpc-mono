import { Module } from '@nestjs/common';
import { CredentialModule } from './credential/credential.module';
import { AuthManagementModule } from './management/auth-management.module';
import { SessionModule } from './session/session.module';

@Module({
  imports: [
    CredentialModule, // 하위 자격 증명 모듈 추가
    AuthManagementModule, // 관리자용 인증 관리 모듈 추가
    SessionModule, // 세션 모듈 추가
  ],
  providers: [],
  exports: [],
})
export class AuthModule { }
