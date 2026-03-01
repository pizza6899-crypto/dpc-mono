import { Module } from '@nestjs/common';
import { AdminAuthManagementController } from './controllers/admin/admin-auth-management.controller';
import { FindLoginAttemptsService } from './application/find-login-attempts.service';
import { ResetUserPasswordAdminService } from './application/reset-user-password-admin.service';
import { CredentialModule } from '../credential/credential.module';
import { AuthPasswordModule } from '../password/auth-password.module';
import { UserProfileModule } from '../../user/profile/user-profile.module';

@Module({
    imports: [
        CredentialModule, // Repository 상속/공유를 위해 필요 (LOGIN_ATTEMPT_REPOSITORY 등)
        AuthPasswordModule, // ChangePasswordService 사용을 위해 필요
        UserProfileModule,
    ],
    controllers: [AdminAuthManagementController],
    providers: [
        FindLoginAttemptsService,
        ResetUserPasswordAdminService,
    ],
})
export class AuthManagementModule { }
