// src/modules/casino-refactor/controllers/user/game.controller.ts
import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardErrors,
  ApiPaginatedResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import type { PaginatedData } from 'src/common/http/types';
import { ListPlayableGamesService } from '../../application/list-playable-games.service';
import { ListPlayableGamesQueryDto } from './dto/request/list-playable-games-query.dto';
import {
  PlayableGameListResponseDto,
  PlayableGameItemDto,
} from './dto/response/playable-game-list.response.dto';
import { Game } from '../../domain';

@Controller('games')
@ApiTags('Games (게임)')
@ApiStandardErrors()
export class GameController {
  constructor(
    private readonly listPlayableGamesService: ListPlayableGamesService,
  ) {}

  /**
   * 플레이 가능한 게임 목록 조회 (유저용)
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @Paginated()
  @ApiOperation({
    summary: 'Get playable games / 플레이 가능한 게임 목록 조회',
    description:
      '유저가 플레이할 수 있는 게임 목록을 조회합니다. 활성화되고 유저에게 보이는 게임만 반환됩니다. 페이징 기능을 지원합니다.',
  })
  @ApiPaginatedResponse(PlayableGameItemDto, {
    status: 200,
    description: 'Successfully retrieved playable games / 플레이 가능한 게임 목록 조회 성공',
  })
  async listPlayableGames(
    @Query() query: ListPlayableGamesQueryDto,
  ): Promise<PaginatedData<PlayableGameItemDto>> {
    const result = await this.listPlayableGamesService.execute({
      page: query.page,
      limit: query.limit,
      includeTranslations: true,
      language: query.language,
      filters: {
        provider: query.provider,
        category: query.category,
      },
    });

    return {
      data: result.data.map((game) => this.toResponseDto(game)),
      page: result.page,
      limit: result.limit,
      total: result.total,
    };
  }

  /**
   * Domain 엔티티를 Response DTO로 변환
   */
  private toResponseDto(game: Game): PlayableGameItemDto {
    return {
      uid: game.uid,
      provider: game.provider,
      category: game.category,
      gameType: game.gameType,
      tableId: game.tableId,
      iconLink: game.iconLink,
      translations: game.getTranslations().map((t) => ({
        language: t.language,
        providerName: t.providerName,
        categoryName: t.categoryName,
        gameName: t.gameName,
      })),
    };
  }
}

