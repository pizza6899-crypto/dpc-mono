import { Module } from '@nestjs/common';
import { ArtifactMasterModule } from './master/master.module';
import { ArtifactInventoryModule } from './inventory/inventory.module';
import { ArtifactStatusModule } from './status/status.module';
import { ArtifactAuditModule } from './audit/audit.module';
import { ArtifactDrawModule } from './draw/draw.module';

@Module({
  imports: [
    ArtifactMasterModule,
    ArtifactInventoryModule,
    ArtifactStatusModule,
    ArtifactAuditModule,
    ArtifactDrawModule,
  ],
})
export class ArtifactModule { }
