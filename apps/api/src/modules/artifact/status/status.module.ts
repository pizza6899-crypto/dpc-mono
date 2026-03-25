import { Module } from '@nestjs/common';
import { ArtifactMasterModule } from '../master/master.module';

@Module({
  imports: [
    ArtifactMasterModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class ArtifactStatusModule { }
