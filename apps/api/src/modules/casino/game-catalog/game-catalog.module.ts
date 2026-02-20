import { forwardRef, Module } from '@nestjs/common';
import { CATEGORY_REPOSITORY, GAME_REPOSITORY } from './ports';
import { CategoryRepository } from './infrastructure/category.repository';
import { CategoryMapper } from './infrastructure/category.mapper';
import { GameRepository } from './infrastructure/game.repository';
import { GameMapper } from './infrastructure/game.mapper';

// Application Services - Category
import { FindCategoriesService } from './application/find-categories.service';
import { GetCategoryByCodeService } from './application/get-category-by-code.service';
import { CreateCategoryService } from './application/create-category.service';
import { UpdateCategoryService } from './application/update-category.service';
import { DeleteCategoryService } from './application/delete-category.service';
import {
  AddGamesToCategoryService,
  RemoveGamesFromCategoryService,
} from './application/manage-category-games.service';

// Application Services - Game
import { FindGamesService } from './application/find-games.service';
import { CreateGameService } from './application/create-game.service';
import { UpdateGameService } from './application/update-game.service';
import { FindGameByIdService } from './application/find-game-by-id.service';

// Controllers
import { CategoryAdminController } from './controllers/admin/category-admin.controller';
import { GameAdminController } from './controllers/admin/game-admin.controller';
import { CategoryUserController } from './controllers/user/category-user.controller';
import { GameUserController } from './controllers/user/game-user.controller';
import { FileModule } from '../../file/file.module';
import { EnvModule } from 'src/common/env/env.module';

import { AggregatorModule } from '../aggregator/aggregator.module';
import { SyncAdminController } from './controllers/admin/sync.admin.controller';
import { SyncGamesService } from './application/sync-games.service';
import { CasinoModule } from '../casino.module';

@Module({
  imports: [
    FileModule,
    EnvModule,
    AggregatorModule,
    forwardRef(() => CasinoModule),
  ],
  controllers: [
    CategoryAdminController,
    GameAdminController,
    CategoryUserController,
    GameUserController,
    SyncAdminController,
  ],
  providers: [
    CategoryMapper,
    GameMapper,
    {
      provide: CATEGORY_REPOSITORY,
      useClass: CategoryRepository,
    },
    {
      provide: GAME_REPOSITORY,
      useClass: GameRepository,
    },
    // Category Services
    FindCategoriesService,
    GetCategoryByCodeService,
    CreateCategoryService,
    UpdateCategoryService,
    DeleteCategoryService,
    AddGamesToCategoryService,
    RemoveGamesFromCategoryService,
    // Game Services
    FindGamesService,
    CreateGameService,
    UpdateGameService,
    FindGameByIdService,
    SyncGamesService,
  ],
  exports: [
    FindCategoriesService,
    GetCategoryByCodeService,
    FindGamesService,
    CreateGameService,
    UpdateGameService,
    FindGameByIdService,
    SyncGamesService,
  ],
})
export class GameCatalogModule {}
