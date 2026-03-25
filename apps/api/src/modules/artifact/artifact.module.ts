import { Module } from '@nestjs/common';
import { ArtifactMasterModule } from './master/master.module';
import { ArtifactStatusModule } from './status/status.module';

@Module({
  imports: [
    ArtifactMasterModule,
    ArtifactStatusModule,
  ],
})
export class ArtifactModule { }
