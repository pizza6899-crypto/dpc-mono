import { Module } from '@nestjs/common';

import { UserArtifactDrawController } from './controllers/user/user-artifact-draw.controller';
import { DrawArtifactService } from './application/draw-artifact.service';
import { ArtifactDrawPolicy } from './domain/artifact-draw.policy';
import { ArtifactStatusModule } from '../status/status.module';
import { ArtifactMasterModule } from '../master/master.module';
import { ArtifactAuditModule } from '../audit/audit.module';
import { WalletModule } from 'src/modules/wallet/wallet.module';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';

/**
 * [Artifact Support] 유물 뽑기 서브 모듈
 */
@Module({
  imports: [
    ArtifactStatusModule,
    ArtifactMasterModule,
    ArtifactAuditModule,
    WalletModule,
    ConcurrencyModule,
  ],
  controllers: [UserArtifactDrawController],
  providers: [DrawArtifactService, ArtifactDrawPolicy],
})
export class ArtifactDrawModule { }
