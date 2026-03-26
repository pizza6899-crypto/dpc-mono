import { Module } from '@nestjs/common';
import { ArtifactMasterModule } from './master/master.module';
import { ArtifactInventoryModule } from './inventory/inventory.module';
import { ArtifactAuditModule } from './audit/audit.module';

@Module({
  imports: [
    ArtifactMasterModule,
    ArtifactInventoryModule,
    ArtifactAuditModule,
  ],
})
export class ArtifactModule { }
