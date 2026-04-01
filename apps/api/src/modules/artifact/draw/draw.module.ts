import { Module } from '@nestjs/common';
import { UserArtifactDrawController } from './controllers/user/user-artifact-draw.controller';
import { RequestArtifactDrawService } from './application/request-artifact-draw.service';
import { SettleArtifactDrawService } from './application/settle-artifact-draw.service';
import { ClaimArtifactDrawService } from './application/claim-artifact-draw.service';
import { ListUnclaimedDrawsService } from './application/list-unclaimed-draws.service';
import { ArtifactDrawPolicy } from './domain/artifact-draw.policy';
import { ArtifactStatusModule } from '../status/status.module';
import { ArtifactMasterModule } from '../master/master.module';
import { ArtifactInventoryModule } from '../inventory/inventory.module';
import { WalletModule } from 'src/modules/wallet/wallet.module';
import { WageringModule } from 'src/modules/wagering/wagering.module';
import { ConcurrencyModule } from 'src/infrastructure/concurrency/concurrency.module';
import { SolanaBlockchainModule } from 'src/infrastructure/blockchain/solana/solana-blockchain.module';
import { ExchangeModule } from 'src/modules/exchange/exchange.module';
import { ArtifactDrawRequestRepositoryPort } from './ports/artifact-draw-request.repository.port';
import { PrismaArtifactDrawRequestRepository } from './infrastructure/prisma-artifact-draw-request.repository';
import { ArtifactDrawRequestMapper } from './infrastructure/artifact-draw-request.mapper';

/**
 * [Artifact Support] 유물 뽑기 서브 모듈
 */
@Module({
  imports: [
    ArtifactStatusModule,
    ArtifactMasterModule,
    ArtifactInventoryModule,
    WalletModule,
    WageringModule,
    ConcurrencyModule,
    SolanaBlockchainModule,
    ExchangeModule,
  ],
  controllers: [UserArtifactDrawController],
  providers: [
    RequestArtifactDrawService,
    SettleArtifactDrawService,
    ClaimArtifactDrawService,
    ListUnclaimedDrawsService,
    ArtifactDrawPolicy,
    ArtifactDrawRequestMapper,
    {
      provide: ArtifactDrawRequestRepositoryPort,
      useClass: PrismaArtifactDrawRequestRepository,
    },
  ],
  exports: [ArtifactDrawRequestRepositoryPort],
})
export class ArtifactDrawModule { }
