import { Module } from '@nestjs/common';
import { CATEGORY_REPOSITORY, GAME_REPOSITORY } from './ports';
import { CategoryRepository } from './infrastructure/category.repository';
import { CategoryMapper } from './infrastructure/category.mapper';
import { GameRepository } from './infrastructure/game.repository';
import { GameMapper } from './infrastructure/game.mapper';
import { FindCategoriesService } from './application/find-categories.service';
import { GetCategoryByCodeService } from './application/get-category-by-code.service';
import { FindGamesService } from './application/find-games.service';
import { CategoryAdminController } from './controllers/admin/category-admin.controller';

@Module({
    controllers: [CategoryAdminController],
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
        FindCategoriesService,
        GetCategoryByCodeService,
        FindGamesService,
    ],
    exports: [FindCategoriesService, GetCategoryByCodeService, FindGamesService],
})
export class GameCatalogModule { }
