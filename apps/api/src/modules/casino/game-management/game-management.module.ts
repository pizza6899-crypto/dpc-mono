import { Module } from '@nestjs/common';
import { CasinoAdminController } from './controllers/admin/casino-admin.controller';
import { FindCasinoGamesService } from './application/find-casino-games.service';
import { UpdateCasinoGameService } from './application/update-casino-game.service';
import { CASINO_GAME_REPOSITORY } from './ports/casino-game.repository.token';
import { CasinoGameRepository } from './infrastructure/casino-game.repository';
import { CasinoGameMapper } from './infrastructure/casino-game.mapper';
import { SqidsModule } from 'src/common/sqids/sqids.module';

@Module({
    imports: [SqidsModule],
    controllers: [CasinoAdminController],
    providers: [
        FindCasinoGamesService,
        UpdateCasinoGameService,
        CasinoGameMapper,
        {
            provide: CASINO_GAME_REPOSITORY,
            useClass: CasinoGameRepository,
        },
    ],
    exports: [FindCasinoGamesService, UpdateCasinoGameService],
})
export class GameManagementModule { }
