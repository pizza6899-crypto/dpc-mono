import { Module } from '@nestjs/common';
import { ArtifactMasterModule } from './master/master.module';
import { ArtifactInventoryModule } from './inventory/inventory.module';

@Module({
  imports: [
    ArtifactMasterModule,
    ArtifactInventoryModule,
  ],
})
export class ArtifactModule { }
