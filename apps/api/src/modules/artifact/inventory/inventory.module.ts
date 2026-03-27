import { Module } from '@nestjs/common';
import { ArtifactMasterModule } from '../master/master.module';
import { ArtifactStatusModule } from '../status/status.module'; // Status 모듈 리소스 참조
import { UserArtifactInventoryController } from './controllers/user/user-artifact-inventory.controller';

@Module({
  imports: [
    ArtifactMasterModule,
    ArtifactStatusModule,
  ],
  controllers: [
    UserArtifactInventoryController,
  ],
  providers: [],
  exports: [],
})
export class ArtifactInventoryModule { }
