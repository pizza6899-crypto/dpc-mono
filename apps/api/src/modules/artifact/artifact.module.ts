import { Module } from '@nestjs/common';
import { ArtifactMasterModule } from './master/master.module';
import { ArtifactInventoryModule } from './inventory/inventory.module';
import { ArtifactStatusModule } from './status/status.module';
import { ArtifactDrawModule } from './draw/draw.module';
import { ArtifactSynthesisModule } from './synthesis/synthesis.module';

@Module({
  imports: [
    ArtifactMasterModule,
    ArtifactInventoryModule,
    ArtifactStatusModule,
    ArtifactDrawModule,
    ArtifactSynthesisModule,
  ],
  exports: [
    ArtifactStatusModule,
  ],
})
export class ArtifactModule { }
