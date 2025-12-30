import { Module } from '@nestjs/common';
import { RegistrationController } from './controllers/user/registration.controller';
import { RegistrationAdminController } from './controllers/admin/registration-admin.controller';
import { RegisterCredentialService } from './application/register-credential.service';
import { RegisterCredentialAdminService } from './application/register-credential-admin.service';
import { RegisterSocialService } from './application/register-social.service';
import { VipModule } from '../../vip/vip.module';
import { AffiliateReferralModule } from '../../affiliate/referral/referral.module';
import { AffiliateCodeModule } from '../../affiliate/code/code.module';
import { AuditLogModule } from 'src/modules/audit-log/audit-log.module';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import { UserModule } from '../../user/user.module';

@Module({
  imports: [
    PrismaModule,
    EnvModule,
    VipModule,
    AffiliateReferralModule,
    AffiliateCodeModule, // 레퍼럴 코드 사전 검증을 위해 필요
    AuditLogModule,
    UserModule, // user 모듈의 CreateUserService 사용을 위해 추가
  ],
  controllers: [RegistrationController, RegistrationAdminController],
  providers: [
    // Application Services
    RegisterCredentialService,
    RegisterCredentialAdminService,
    RegisterSocialService,
  ],
  exports: [RegisterCredentialService, RegisterSocialService],
})
export class RegistrationModule {}
