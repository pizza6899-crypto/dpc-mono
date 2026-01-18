import { Module } from '@nestjs/common';
import { CASINO_AGGREGATOR_REPOSITORY } from './ports/casino-aggregator.repository.token';
import { CasinoAggregatorRepository } from './infrastructure/casino-aggregator.repository';
import { CasinoAggregatorMapper } from './infrastructure/casino-aggregator.mapper';
import { FindAggregatorService } from './application/find-aggregator.service';
import { FindAggregatorsService } from './application/find-aggregators.service';
import { CreateAggregatorService } from './application/create-aggregator.service';
import { UpdateAggregatorService } from './application/update-aggregator.service';
import { AggregatorRegistryService } from './application/aggregator-registry.service';
import { AggregatorAdminController } from './controllers/admin/aggregator-admin.controller';

@Module({
    controllers: [AggregatorAdminController],
    providers: [
        // Infrastructure
        CasinoAggregatorMapper,
        {
            provide: CASINO_AGGREGATOR_REPOSITORY,
            useClass: CasinoAggregatorRepository,
        },
        // Application
        FindAggregatorService,
        FindAggregatorsService,
        CreateAggregatorService,
        UpdateAggregatorService,
        AggregatorRegistryService,
    ],
    exports: [AggregatorRegistryService],
})
export class AggregatorModule { }
