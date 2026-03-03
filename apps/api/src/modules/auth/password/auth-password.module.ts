import { Module } from '@nestjs/common';
import { UserPasswordController } from './controllers/user-password.controller';
import { ChangePasswordService } from './application/change-password.service';
import { RequestPasswordResetService } from './application/request-password-reset.service';
import { ResetPasswordService } from './application/reset-password.service';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from './ports/out/password-reset-token.repository.token';
import { PasswordResetTokenRepository } from './infrastructure/password-reset-token.repository';
import { CredentialModule } from '../credential/credential.module';
import { UserProfileModule } from '../../user/profile/user-profile.module';

@Module({
    imports: [
        CredentialModule, // VerifyCredentialService 사용을 위해 필요
        UserProfileModule, // UserRepository 사용을 위해 필요
    ],
    controllers: [UserPasswordController],
    providers: [
        ChangePasswordService,
        RequestPasswordResetService,
        ResetPasswordService,
        {
            provide: PASSWORD_RESET_TOKEN_REPOSITORY,
            useClass: PasswordResetTokenRepository,
        },
    ],
    exports: [
        ChangePasswordService,
        RequestPasswordResetService,
        ResetPasswordService,
        PASSWORD_RESET_TOKEN_REPOSITORY,
    ],
})
export class AuthPasswordModule { }
