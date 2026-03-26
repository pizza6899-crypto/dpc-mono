import { Module } from '@nestjs/common';
import { ArtifactMasterModule } from './master/master.module';
import { ArtifactInventoryModule } from './inventory/inventory.module';
import { ArtifactStatusModule } from './status/status.module';
import { ArtifactAuditModule } from './audit/audit.module';

@Module({
  imports: [
    ArtifactMasterModule,
    ArtifactInventoryModule,
    ArtifactStatusModule,
    ArtifactAuditModule,
  ],
})
export class ArtifactModule { }
