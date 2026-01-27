import { Module, Global } from '@nestjs/common';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { TierRepository } from './infrastructure/tier.repository';
import { TIER_REPOSITORY } from './infrastructure/tier.repository.port';
import { UserTierRepository } from './infrastructure/user-tier.repository';
import { USER_TIER_REPOSITORY } from './infrastructure/user-tier.repository.port';
import { TierConfigRepository } from './infrastructure/tier-config.repository';
import { TIER_CONFIG_REPOSITORY } from './infrastructure/tier-config.repository.port';
import { GetTierConfigService } from './application/get-tier-config.service';
import { GetUserTierService } from './application/get-user-tier.service';
import { CalculateEffectiveBenefitsService } from './application/calculate-effective-benefits.service';

@Global()
@Module({
    imports: [PrismaModule],
    providers: [
        {
            provide: TIER_REPOSITORY,
            useClass: TierRepository,
        },
        {
            provide: USER_TIER_REPOSITORY,
            useClass: UserTierRepository,
        },
        {
            provide: TIER_CONFIG_REPOSITORY,
            useClass: TierConfigRepository,
        },
        GetTierConfigService,
        GetUserTierService,
        CalculateEffectiveBenefitsService,
    ],
    exports: [
        TIER_REPOSITORY,
        USER_TIER_REPOSITORY,
        TIER_CONFIG_REPOSITORY,
        GetTierConfigService,
        GetUserTierService,
        CalculateEffectiveBenefitsService,
    ],
})
export class TierCoreModule { }
