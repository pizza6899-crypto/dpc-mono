import { Module } from '@nestjs/common';

import { UserArtifactDrawController } from './controllers/user/user-artifact-draw.controller';
import { DrawArtifactService } from './application/draw-artifact.service';
import { DrawArtifactByTicketService } from './application/draw-artifact-by-ticket.service';
import { DrawArtifactByCurrencyService } from './application/draw-artifact-by-currency.service';
import { ArtifactDrawPolicy } from './domain/artifact-draw.policy';
import { ArtifactStatusModule } from '../status/status.module';
import { ArtifactMasterModule } from '../master/master.module';
import { ArtifactInventoryModule } from '../inventory/inventory.module';
import { WalletModule } from 'src/modules/wallet/wallet.module';
import { ConcurrencyModule } from 'src/infrastructure/concurrency/concurrency.module';

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
    ConcurrencyModule,
  ],
  controllers: [UserArtifactDrawController],
  providers: [
    DrawArtifactService,
    DrawArtifactByTicketService,
    DrawArtifactByCurrencyService,
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
