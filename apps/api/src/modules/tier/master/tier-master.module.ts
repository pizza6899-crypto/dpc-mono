import { Module, Global } from '@nestjs/common';
import { TierRepositoryPort, TierSettingsRepositoryPort } from './infrastructure/master.repository.port';
import { TierRepository } from './infrastructure/tier.repository';
import { TierSettingsRepository } from './infrastructure/tier-settings.repository';
import { TierSettingsService } from './application/tier-settings.service';
import { TierService } from './application/tier.service';
import { TierMasterPolicy } from './domain/tier-master.policy';
import { TierSettingsAdminController } from './controllers/admin/tier-settings-admin.controller';
import { TierAdminController } from './controllers/admin/tier-admin.controller';
import { TierPublicController } from './controllers/public/tier-public.controller';
import { FileModule } from '../../file/file.module';
import { EnvModule } from 'src/common/env/env.module';

@Global()
@Module({
    imports: [FileModule, EnvModule],
    controllers: [TierSettingsAdminController, TierAdminController, TierPublicController],
    providers: [
        TierSettingsService,
        TierService,
        TierMasterPolicy,
        { provide: TierRepositoryPort, useClass: TierRepository },
        { provide: TierSettingsRepositoryPort, useClass: TierSettingsRepository },
    ],
    exports: [TierRepositoryPort, TierSettingsRepositoryPort, TierSettingsService, TierService],
})
export class TierMasterModule { }
