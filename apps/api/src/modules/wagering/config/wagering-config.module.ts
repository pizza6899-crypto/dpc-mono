import { Module } from '@nestjs/common';
import { WageringConfigMapper } from './infrastructure/wagering-config.mapper';
import { WageringConfigRepository } from './infrastructure/wagering-config.repository';
import { WAGERING_CONFIG_REPOSITORY } from './ports/wagering-config.repository.port';
import { GetWageringConfigService } from './application/get-wagering-config.service';
import { UpdateWageringConfigService } from './application/update-wagering-config.service';
import { WageringConfigAdminController } from './controllers/admin/wagering-config-admin.controller';
import { AuditLogModule } from '../../audit-log/audit-log.module';
import { CacheModule } from 'src/common/cache/cache.module';

@Module({
    imports: [AuditLogModule, CacheModule],
    controllers: [WageringConfigAdminController],
    providers: [
        WageringConfigMapper,
        {
            provide: WAGERING_CONFIG_REPOSITORY,
            useClass: WageringConfigRepository,
        },
        GetWageringConfigService,
        UpdateWageringConfigService,
    ],
    exports: [
        GetWageringConfigService,
        UpdateWageringConfigService,
    ],
})
export class WageringConfigModule { }
