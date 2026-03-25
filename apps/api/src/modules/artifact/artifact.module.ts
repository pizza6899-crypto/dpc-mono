import { Module } from '@nestjs/common';
import { ArtifactMasterModule } from './master/master.module';

@Module({
  imports: [
    ArtifactMasterModule,
  ],
})
export class ArtifactModule { }
