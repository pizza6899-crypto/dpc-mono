import { Module } from '@nestjs/common';
import { ArtifactMasterModule } from '../master/master.module';

@Module({
  imports: [
    ArtifactMasterModule, // 마스터 정책 및 도감 데이터 참조를 위해 임포트
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class ArtifactInventoryModule { }
