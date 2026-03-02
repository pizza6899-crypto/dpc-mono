import { Module } from '@nestjs/common';
import { CreateCasinoGameSessionService } from './application/create-casino-game-session.service';
import { FindCasinoGameSessionService } from './application/find-casino-game-session.service';
import { RevokeUserGameSessionsService } from './application/revoke-user-game-sessions.service';
import { CasinoGameSessionMapper } from './infrastructure/mapper/casino-game-session.mapper';
import { CasinoGameSessionRepository } from './infrastructure/repository/casino-game-session.repository';
import { CASINO_GAME_SESSION_REPOSITORY } from './ports/casino-game-session.repository.token';
import { ExchangeModule } from '../../exchange/exchange.module';

import { TierProfileModule } from '../../tier/profile/tier-profile.module';

@Module({
  imports: [ExchangeModule, TierProfileModule],
  providers: [
    CasinoGameSessionMapper,
    {
      provide: CASINO_GAME_SESSION_REPOSITORY,
      useClass: CasinoGameSessionRepository,
    },
    CreateCasinoGameSessionService,
    FindCasinoGameSessionService,
    RevokeUserGameSessionsService,
  ],
  exports: [
    CreateCasinoGameSessionService,
    FindCasinoGameSessionService,
    RevokeUserGameSessionsService,
    CASINO_GAME_SESSION_REPOSITORY,
  ],
})
export class GameSessionModule { }
