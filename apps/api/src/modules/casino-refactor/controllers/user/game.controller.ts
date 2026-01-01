// src/modules/casino-refactor/controllers/user/game.controller.ts
import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardErrors,
  ApiPaginatedResponse,
  ApiStandardResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { Public } from 'src/common/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { RequestClientInfoParam } from 'src/common/auth/decorators/request-info.decorator';
import type { RequestClientInfo } from 'src/common/http/types';
import { Throttle } from 'src/common/throttle/decorators/throttle.decorator';
import { ThrottleScope } from 'src/common/throttle/types/throttle.types';
import type { PaginatedData } from 'src/common/http/types';
import { ListPlayableGamesService } from '../../application/list-playable-games.service';
import { LaunchGameService } from '../../application/launch-game.service';
import { ListPlayableGamesQueryDto } from './dto/request/list-playable-games-query.dto';
import { LaunchGameRequestDto } from './dto/request/launch-game.dto';
import {
  PlayableGameListResponseDto,
  PlayableGameItemDto,
} from './dto/response/playable-game-list.response.dto';
import { LaunchGameResponseDto } from './dto/response/launch-game.response.dto';
import { Game } from '../../domain';

@Controller('games')
@ApiTags('Games (게임)')
@ApiStandardErrors()
export class GameController {
  constructor(
    private readonly listPlayableGamesService: ListPlayableGamesService,
    private readonly launchGameService: LaunchGameService,
  ) {}

  /**
   * 플레이 가능한 게임 목록 조회 (유저용)
   */
  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @Paginated()
  @Throttle({
    limit: 100,
    ttl: 60, // 1분
    scope: ThrottleScope.IP,
  })
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
   * 게임 실행 (유저용)
   */
  @Post('launch')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    limit: 30,
    ttl: 60, // 1분
    scope: ThrottleScope.USER,
  })
  @ApiOperation({
    summary: 'Launch game / 게임 실행',
    description:
      '유저가 게임을 실행합니다. 게임 UID를 받아 게임 실행 URL을 반환합니다.',
  })
  @ApiStandardResponse(LaunchGameResponseDto, {
    status: 200,
    description: 'Successfully launched game / 게임 실행 성공',
  })
  async launchGame(
    @CurrentUser() user: CurrentUserWithSession,
    @Body() dto: LaunchGameRequestDto,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<LaunchGameResponseDto> {
    const result = await this.launchGameService.execute({
      user,
      gameUid: dto.gameUid,
      isMobile: dto.isMobile,
      walletCurrency: dto.walletCurrency,
      gameCurrency: dto.gameCurrency,
      requestInfo,
    });

    return {
      gameUrl: result.gameUrl,
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

