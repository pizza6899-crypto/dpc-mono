import { Module } from '@nestjs/common';
import { CASINO_AGGREGATOR_REPOSITORY } from './ports/casino-aggregator.repository.token';
import { CasinoAggregatorRepository } from './infrastructure/casino-aggregator.repository';
import { CasinoAggregatorMapper } from './infrastructure/casino-aggregator.mapper';
import { FindAggregatorsService } from './application/find-aggregators.service';
import { UpdateAggregatorService } from './application/update-aggregator.service';
import { AggregatorRegistryService } from './application/aggregator-registry.service';
import { AggregatorAdminController } from './controllers/admin/aggregator-admin.controller';
import { EnvModule } from 'src/common/env/env.module';
import { FileModule } from '../../file/file.module';

import { CASINO_GAME_PROVIDER_REPOSITORY } from './ports/casino-game-provider.repository.token';
import { CasinoGameProviderRepository } from './infrastructure/casino-game-provider.repository';
import { CasinoGameProviderMapper } from './infrastructure/casino-game-provider.mapper';

@Module({
    imports: [EnvModule, FileModule],
    controllers: [AggregatorAdminController],
    providers: [
        // Infrastructure
        CasinoAggregatorMapper,
        {
            provide: CASINO_AGGREGATOR_REPOSITORY,
            useClass: CasinoAggregatorRepository,
        },
        CasinoGameProviderMapper,
        {
            provide: CASINO_GAME_PROVIDER_REPOSITORY,
            useClass: CasinoGameProviderRepository,
        },
        // Application
        FindAggregatorsService,
        UpdateAggregatorService,
        AggregatorRegistryService,
    ],
    exports: [AggregatorRegistryService],
})
export class AggregatorModule { }
