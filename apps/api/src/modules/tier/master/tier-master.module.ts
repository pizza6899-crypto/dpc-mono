import { Module, Global } from '@nestjs/common';
import { TierRepositoryPort, TierSettingsRepositoryPort } from './infrastructure/master.repository.port';
import { TierRepository } from './infrastructure/tier.repository';
import { TierSettingsRepository } from './infrastructure/tier-settings.repository';
import { TierSettingsService } from './application/tier-settings.service';
import { TierSettingsAdminController } from './controllers/admin/tier-settings-admin.controller';

@Global()
@Module({
    imports: [],
    controllers: [TierSettingsAdminController],
    providers: [
        TierSettingsService,
        { provide: TierRepositoryPort, useClass: TierRepository },
        { provide: TierSettingsRepositoryPort, useClass: TierSettingsRepository },
    ],
    exports: [TierRepositoryPort, TierSettingsRepositoryPort, TierSettingsService],
})
export class TierMasterModule { }
