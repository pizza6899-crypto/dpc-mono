import { Module } from '@nestjs/common';
import { CASINO_AGGREGATOR_REPOSITORY } from './ports/casino-aggregator.repository.token';
import { CasinoAggregatorRepository } from './infrastructure/casino-aggregator.repository';
import { CasinoAggregatorMapper } from './infrastructure/casino-aggregator.mapper';
import { FindAggregatorsService } from './application/find-aggregators.service';
import { UpdateAggregatorService } from './application/update-aggregator.service';
import { AggregatorRegistryService } from './application/aggregator-registry.service';
import { AggregatorAdminController } from './controllers/admin/aggregator-admin.controller';
import { EnvModule } from 'src/common/env/env.module';

@Module({
    imports: [EnvModule],
    controllers: [AggregatorAdminController],
    providers: [
        // Infrastructure
        CasinoAggregatorMapper,
        {
            provide: CASINO_AGGREGATOR_REPOSITORY,
            useClass: CasinoAggregatorRepository,
        },
        // Application
        FindAggregatorsService,
        UpdateAggregatorService,
        AggregatorRegistryService,
    ],
    exports: [AggregatorRegistryService],
})
export class AggregatorModule { }
