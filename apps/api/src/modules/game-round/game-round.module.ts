import { Module } from '@nestjs/common';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';
import { GameRoundRepository } from './infrastructure/game-round.repository';
import { GameTransactionRepository } from './infrastructure/game-transaction.repository';
import { GameRoundMapper } from './infrastructure/game-round.mapper';
import { GameTransactionMapper } from './infrastructure/game-transaction.mapper';
import { GAME_ROUND_REPOSITORY_TOKEN } from './ports/game-round.repository.token';
import { GAME_TRANSACTION_REPOSITORY_TOKEN } from './ports/game-transaction.repository.token';
import { ResolveGameRoundService } from './application/resolve-game-round.service';

@Module({
  imports: [SnowflakeModule],
  providers: [
    GameRoundMapper,
    GameTransactionMapper,
    {
      provide: GAME_ROUND_REPOSITORY_TOKEN,
      useClass: GameRoundRepository,
    },
    {
      provide: GAME_TRANSACTION_REPOSITORY_TOKEN,
      useClass: GameTransactionRepository,
    },
    ResolveGameRoundService,
  ],
  exports: [
    GAME_ROUND_REPOSITORY_TOKEN,
    GAME_TRANSACTION_REPOSITORY_TOKEN,
    ResolveGameRoundService,
  ],
})
export class GameRoundModule {}
