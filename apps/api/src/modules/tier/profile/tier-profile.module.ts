import { Module } from '@nestjs/common';
import { UserTierRepositoryPort, UserTierRepository } from './infrastructure/user-tier.repository';
import { InitializeUserTierService } from './application/initialize-user-tier.service';

@Module({
    imports: [],
    providers: [
        { provide: UserTierRepositoryPort, useClass: UserTierRepository },
        InitializeUserTierService,
    ],
    exports: [UserTierRepositoryPort, InitializeUserTierService],
})
export class TierProfileModule { }
