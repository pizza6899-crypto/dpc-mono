// src/modules/casino-refactor/casino-refactor.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { ListGamesService } from './application/list-games.service';
import { ListPlayableGamesService } from './application/list-playable-games.service';
import { UpdateGameService } from './application/update-game.service';
import { UpdateGameTranslationService } from './application/update-game-translation.service';
import { SyncGamesFromAggregatorService } from './application/sync-games-from-aggregator.service';
import { LaunchGameService } from './application/launch-game.service';
import { GameAdminController } from './controllers/admin/game-admin.controller';
import { GameController } from './controllers/user/game.controller';
import { GameRepository } from './infrastructure/game.repository';
import { GameMapper } from './infrastructure/game.mapper';
import { GAME_REPOSITORY } from './ports/out/game.repository.token';
import { DcModule } from './aggregator/dc/dc.module';
import { WcModule } from './aggregator/wc/wc.module';
import { AuditLogModule } from 'src/modules/audit-log/audit-log.module';
import { GameBalanceService } from './application/game-balance.service';
import { GameSessionService } from './application/game-session.service';
import { ExchangeModule } from 'src/modules/exchange/exchange.module';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';

@Module({
  imports: [
    DcModule,
    WcModule,
    AuditLogModule,
    ExchangeModule,
    PrismaModule,
  ],
  providers: [
    ListGamesService,
    ListPlayableGamesService,
    UpdateGameService,
    UpdateGameTranslationService,
    SyncGamesFromAggregatorService,
    LaunchGameService,
    GameMapper,
    GameBalanceService,
    GameSessionService,
    {
      provide: GAME_REPOSITORY,
      useClass: GameRepository,
    },
  ],
  controllers: [
    GameAdminController,
    GameController,
  ],
  exports: [
    ListGamesService,
    ListPlayableGamesService,
    GAME_REPOSITORY,
  ],
})
export class CasinoRefactorModule {}

