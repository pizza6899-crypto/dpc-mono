import { Module } from '@nestjs/common';
import { ArtifactMasterModule } from '../master/master.module';
import { ArtifactInventoryModule } from '../inventory/inventory.module';
import { ArtifactStatusModule } from '../status/status.module';
import { UserArtifactSynthesisController } from './controllers/user/user-artifact-synthesis.controller';
import { SynthesizeArtifactService } from './application/synthesize-artifact.service';
import { ArtifactSynthesisPolicy } from './domain/artifact-synthesis.policy';
import { ConcurrencyModule } from 'src/infrastructure/concurrency/concurrency.module';
import { SolanaBlockchainModule } from 'src/infrastructure/blockchain/solana/solana-blockchain.module';

@Module({
  imports: [
    ArtifactMasterModule,
    ArtifactInventoryModule,
    ArtifactStatusModule,
    ConcurrencyModule,
    SolanaBlockchainModule,
  ],
  controllers: [
    UserArtifactSynthesisController,
  ],
  providers: [
    SynthesizeArtifactService,
    ArtifactSynthesisPolicy,
  ],
})
export class ArtifactSynthesisModule { }
