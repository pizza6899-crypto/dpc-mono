import { Module } from '@nestjs/common';
import { AffiliateCodeModule } from '../../affiliate/code/code.module';
import { AuditLogModule } from 'src/modules/audit-log/audit-log.module';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import { UserProfileModule } from '../profile/user-profile.module';
import { WalletModule } from '../../wallet/wallet.module';
import { TierModule } from '../../tier/tier.module';
import { AffiliateReferralModule } from 'src/modules/affiliate/referral/referral.module';
import { UserAccountController } from './controllers/user/account.controller';
import { UserAccountAdminController } from './controllers/admin/account-admin.controller';
import { RegisterUserService } from './application/register-user.service';
import { RegisterAdminService } from './application/register-admin.service';

@Module({
    imports: [
        PrismaModule,
        EnvModule,
        AffiliateReferralModule,
        AffiliateCodeModule,
        AuditLogModule,
        UserProfileModule,
        WalletModule,
        TierModule,
    ],
    controllers: [UserAccountController, UserAccountAdminController],
    providers: [
        RegisterUserService,
        RegisterAdminService,
    ],
    exports: [RegisterUserService, RegisterAdminService],
})
export class UserAccountModule { }
