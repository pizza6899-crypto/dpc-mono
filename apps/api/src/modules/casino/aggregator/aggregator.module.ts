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

// Provider Application Services
import { CreateGameProviderService } from './application/provider/create-game-provider.service';
import { FindGameProvidersService } from './application/provider/find-game-providers.service';
import { UpdateGameProviderService } from './application/provider/update-game-provider.service';
import { GameProviderAdminController } from './controllers/admin/game-provider-admin.controller';

@Module({
    imports: [EnvModule, FileModule],
    controllers: [AggregatorAdminController, GameProviderAdminController],
    providers: [
        // Infrastructure - Aggregator
        CasinoAggregatorMapper,
        {
            provide: CASINO_AGGREGATOR_REPOSITORY,
            useClass: CasinoAggregatorRepository,
        },
        // Infrastructure - Provider
        CasinoGameProviderMapper,
        {
            provide: CASINO_GAME_PROVIDER_REPOSITORY,
            useClass: CasinoGameProviderRepository,
        },
        // Application - Aggregator
        FindAggregatorsService,
        UpdateAggregatorService,
        AggregatorRegistryService,
        // Application - Provider
        CreateGameProviderService,
        FindGameProvidersService,
        UpdateGameProviderService,
    ],
    exports: [AggregatorRegistryService],
})
export class AggregatorModule { }

