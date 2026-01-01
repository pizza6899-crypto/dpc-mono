// src/modules/casino-refactor/casino-refactor.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { ListGamesService } from './application/list-games.service';
import { ListPlayableGamesService } from './application/list-playable-games.service';
import { UpdateGameService } from './application/update-game.service';
import { UpdateGameTranslationService } from './application/update-game-translation.service';
import { SyncGamesFromAggregatorService } from './application/sync-games-from-aggregator.service';
import { GameAdminController } from './controllers/admin/game-admin.controller';
import { GameController } from './controllers/user/game.controller';
import { GameRepository } from './infrastructure/game.repository';
import { GameMapper } from './infrastructure/game.mapper';
import { GAME_REPOSITORY } from './ports/out/game.repository.token';
import { DcModule } from './aggregator/dc/dc.module';

@Module({
  imports: [DcModule],
  providers: [
    ListGamesService,
    ListPlayableGamesService,
    UpdateGameService,
    UpdateGameTranslationService,
    SyncGamesFromAggregatorService,
    GameMapper,
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

