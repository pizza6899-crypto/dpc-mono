import { Module, Global } from '@nestjs/common';
import { TierRepositoryPort, TierConfigRepositoryPort } from './infrastructure/master.repository.port';
import { TierRepository } from './infrastructure/tier.repository';
import { TierConfigRepository } from './infrastructure/tier-config.repository';

@Global()
@Module({
    imports: [],
    providers: [
        { provide: TierRepositoryPort, useClass: TierRepository },
        { provide: TierConfigRepositoryPort, useClass: TierConfigRepository },
    ],
    exports: [TierRepositoryPort, TierConfigRepositoryPort],
})
export class TierMasterModule { }
