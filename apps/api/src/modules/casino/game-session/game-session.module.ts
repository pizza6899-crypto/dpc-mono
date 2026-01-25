import { Module } from '@nestjs/common';
import { CreateCasinoGameSessionService } from './application/create-casino-game-session.service';
import { FindCasinoGameSessionService } from './application/find-casino-game-session.service';
import { CasinoGameSessionMapper } from './infrastructure/mapper/casino-game-session.mapper';
import { CasinoGameSessionRepository } from './infrastructure/repository/casino-game-session.repository';
import { CASINO_GAME_SESSION_REPOSITORY } from './ports/casino-game-session.repository.token';
import { ExchangeModule } from '../../exchange/exchange.module';
import { TierModule } from '../../tier/tier.module';

@Module({
    imports: [ExchangeModule, TierModule],
    providers: [
        CasinoGameSessionMapper,
        {
            provide: CASINO_GAME_SESSION_REPOSITORY,
            useClass: CasinoGameSessionRepository,
        },
        CreateCasinoGameSessionService,
        FindCasinoGameSessionService,
    ],
    exports: [
        CreateCasinoGameSessionService,
        FindCasinoGameSessionService,
        CASINO_GAME_SESSION_REPOSITORY,
    ],
})
export class GameSessionModule { }
