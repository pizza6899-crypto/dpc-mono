import { Module, Global } from '@nestjs/common';
import { TierRepositoryPort } from './infrastructure/tier.repository.port';
import { TierConfigRepositoryPort } from './infrastructure/tier-config.repository.port';
import { TierRepository } from './infrastructure/tier.repository';
import { TierConfigRepository } from './infrastructure/tier-config.repository';
import { TierConfigService } from './application/tier-config.service';
import { TierService } from './application/tier.service';
import { TierDefinitionsPolicy } from './domain/tier-definitions.policy';
import { TierConfigAdminController } from './controllers/admin/tier-config-admin.controller';
import { TierAdminController } from './controllers/admin/tier-admin.controller';
import { TierPublicController } from './controllers/public/tier-public.controller';
import { FileModule } from '../../file/file.module';
import { EnvModule } from 'src/common/env/env.module';

@Global()
@Module({
  imports: [FileModule, EnvModule],
  controllers: [
    TierConfigAdminController,
    TierAdminController,
    TierPublicController,
  ],
  providers: [
    TierConfigService,
    TierService,
    TierDefinitionsPolicy,
    { provide: TierRepositoryPort, useClass: TierRepository },
    { provide: TierConfigRepositoryPort, useClass: TierConfigRepository },
  ],
  exports: [
    TierRepositoryPort,
    TierConfigRepositoryPort,
    TierConfigService,
    TierService,
  ],
})
export class TierDefinitionsModule {}
