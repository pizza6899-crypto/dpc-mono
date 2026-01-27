import { Module } from '@nestjs/common';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';
import { TierAuditRepositoryPort } from './infrastructure/audit.repository.port';
import { TierAuditRepository } from './infrastructure/tier-audit.repository';
import { TierAuditService } from './application/tier-audit.service';

@Module({
    imports: [SnowflakeModule],
    providers: [
        { provide: TierAuditRepositoryPort, useClass: TierAuditRepository },
        TierAuditService,
    ],
    exports: [TierAuditRepositoryPort, TierAuditService],
})
export class TierAuditModule { }
