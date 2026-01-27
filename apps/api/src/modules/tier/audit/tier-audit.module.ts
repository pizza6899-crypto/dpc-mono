import { Module } from '@nestjs/common';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';
import { TierHistoryRepositoryPort, TierHistoryRepository } from './infrastructure/tier-history.repository';

@Module({
    imports: [SnowflakeModule],
    providers: [
        { provide: TierHistoryRepositoryPort, useClass: TierHistoryRepository },
    ],
    exports: [TierHistoryRepositoryPort],
})
export class TierAuditModule { }
