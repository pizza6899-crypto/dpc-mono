// src/modules/casino-refactor/controllers/admin/game-admin.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import {
  ApiStandardErrors,
  ApiPaginatedResponse,
  ApiStandardResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import { RequireRoles } from 'src/common/auth/decorators/roles.decorator';
import { UserRoleType } from '@repo/database';
import type { PaginatedData } from 'src/common/http/types';
import { ListGamesService } from '../../application/list-games.service';
import { UpdateGameService } from '../../application/update-game.service';
import { UpdateGameTranslationService } from '../../application/update-game-translation.service';
import { SyncGamesFromAggregatorService } from '../../application/sync-games-from-aggregator.service';
import { ListGamesQueryDto } from './dto/request/list-games-query.dto';
import { UpdateGameDto } from './dto/request/update-game.dto';
import { UpdateGameTranslationDto } from './dto/request/update-game-translation.dto';
import { SyncGamesFromAggregatorDto } from './dto/request/sync-games-from-aggregator.dto';
import { GameListItemDto } from './dto/response/game-list.response.dto';
import { UpdateGameResponseDto } from './dto/response/update-game.response.dto';
import { UpdateGameTranslationResponseDto } from './dto/response/update-game-translation.response.dto';
import { SyncGamesFromAggregatorResponseDto } from './dto/response/sync-games-from-aggregator.response.dto';
import { Game, GameTranslation } from '../../domain';

@Controller('admin/games')
@ApiTags('Admin Games (관리자 게임 관리)')
@RequireRoles(UserRoleType.ADMIN, UserRoleType.SUPER_ADMIN)
@ApiStandardErrors()
export class GameAdminController {
  constructor(
    private readonly listGamesService: ListGamesService,
    private readonly updateGameService: UpdateGameService,
    private readonly updateGameTranslationService: UpdateGameTranslationService,
    private readonly syncGamesFromAggregatorService: SyncGamesFromAggregatorService,
  ) {}

  /**
   * 게임 목록 조회 (관리자용)
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @Paginated()
  @ApiOperation({
    summary: 'Get game list / 게임 목록 조회 (관리자용)',
    description:
      '관리자가 등록된 게임 목록을 조회합니다. 페이징, 필터링 기능을 지원합니다.',
  })
  @ApiPaginatedResponse(GameListItemDto, {
    status: 200,
    description: 'Successfully retrieved game list / 게임 목록 조회 성공',
  })
  async listGames(
    @Query() query: ListGamesQueryDto,
  ): Promise<PaginatedData<GameListItemDto>> {
    const result = await this.listGamesService.execute({
      page: query.page,
      limit: query.limit,
      includeTranslations: query.includeTranslations,
      language: query.language,
      filters: {
        isEnabled: query.isEnabled,
        isVisibleToUser: query.isVisibleToUser,
        provider: query.provider,
        category: query.category,
        aggregatorType: query.aggregatorType,
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
   * 게임 정보 업데이트 (관리자용)
   */
  @Patch(':uid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update game / 게임 정보 업데이트 (관리자용)',
    description: '관리자가 게임 정보를 업데이트합니다.',
  })
  @ApiParam({
    name: 'uid',
    description: '게임 UID',
    example: 'game-1234567890',
  })
  @ApiStandardResponse(UpdateGameResponseDto, {
    status: 200,
    description: 'Successfully updated game / 게임 정보 업데이트 성공',
  })
  async updateGame(
    @Param('uid') uid: string,
    @Body() dto: UpdateGameDto,
  ): Promise<UpdateGameResponseDto> {
    const game = await this.updateGameService.execute({
      gameUid: uid,
      gameType: dto.gameType,
      tableId: dto.tableId,
      iconLink: dto.iconLink,
      isEnabled: dto.isEnabled,
      isVisibleToUser: dto.isVisibleToUser,
      houseEdge: dto.houseEdge,
      contributionRate: dto.contributionRate,
    });

    return this.toUpdateGameResponseDto(game);
  }

  /**
   * 게임 번역 정보 업데이트 (관리자용)
   */
  @Patch(':uid/translations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update game translation / 게임 번역 정보 업데이트 (관리자용)',
    description: '관리자가 게임 번역 정보를 업데이트합니다.',
  })
  @ApiParam({
    name: 'uid',
    description: '게임 UID',
    example: 'game-1234567890',
  })
  @ApiStandardResponse(UpdateGameTranslationResponseDto, {
    status: 200,
    description: 'Successfully updated game translation / 게임 번역 정보 업데이트 성공',
  })
  async updateGameTranslation(
    @Param('uid') uid: string,
    @Body() dto: UpdateGameTranslationDto,
  ): Promise<UpdateGameTranslationResponseDto> {
    const translation = await this.updateGameTranslationService.execute({
      gameUid: uid,
      language: dto.language,
      providerName: dto.providerName,
      categoryName: dto.categoryName,
      gameName: dto.gameName,
    });

    return this.toUpdateGameTranslationResponseDto(translation);
  }

  /**
   * 게임 데이터 동기화 (관리자용)
   */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sync games from aggregator / 게임 애그리게이터에서 게임 데이터 동기화 (관리자용)',
    description:
      '관리자가 명시적으로 호출하여 하위 게임 애그리게이터 API를 통해 게임 데이터를 업데이트하거나 생성합니다. (신규 게임, 서비스 종료 게임, 이미지 변경, 이름 변경, 다국어 등)',
  })
  @ApiStandardResponse(SyncGamesFromAggregatorResponseDto, {
    status: 200,
    description: 'Successfully synced games from aggregator / 게임 데이터 동기화 성공',
  })
  async syncGamesFromAggregator(
    @Body() dto: SyncGamesFromAggregatorDto,
  ): Promise<SyncGamesFromAggregatorResponseDto> {
    return await this.syncGamesFromAggregatorService.execute({
      aggregatorType: dto.aggregatorType,
      provider: dto.provider,
      language: dto.language,
    });
  }

  /**
   * Domain 엔티티를 Response DTO로 변환
   */
  private toResponseDto(game: Game): GameListItemDto {
    return {
      id: game.id?.toString() ?? '',
      uid: game.uid,
      aggregatorType: game.aggregatorType,
      provider: game.provider,
      category: game.category,
      aggregatorGameId: game.aggregatorGameId,
      gameType: game.gameType,
      tableId: game.tableId,
      iconLink: game.iconLink,
      isEnabled: game.isEnabled,
      isVisibleToUser: game.isVisibleToUser,
      houseEdge: game.houseEdge.toString(),
      contributionRate: game.contributionRate.toString(),
      translations: game.hasTranslations()
        ? game.getTranslations().map((t) => ({
            id: t.id?.toString() ?? '',
            language: t.language,
            providerName: t.providerName,
            categoryName: t.categoryName,
            gameName: t.gameName,
          }))
        : undefined,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
    };
  }

  /**
   * Domain 엔티티를 Update Game Response DTO로 변환
   */
  private toUpdateGameResponseDto(game: Game): UpdateGameResponseDto {
    return {
      id: game.id?.toString() ?? '',
      uid: game.uid,
      aggregatorType: game.aggregatorType,
      provider: game.provider,
      category: game.category,
      aggregatorGameId: game.aggregatorGameId,
      gameType: game.gameType,
      tableId: game.tableId,
      iconLink: game.iconLink,
      isEnabled: game.isEnabled,
      isVisibleToUser: game.isVisibleToUser,
      houseEdge: game.houseEdge.toString(),
      contributionRate: game.contributionRate.toString(),
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
    };
  }

  /**
   * Domain 엔티티를 Update Game Translation Response DTO로 변환
   */
  private toUpdateGameTranslationResponseDto(
    translation: GameTranslation,
  ): UpdateGameTranslationResponseDto {
    return {
      id: translation.id?.toString() ?? '',
      uid: translation.uid,
      gameId: translation.gameId.toString(),
      language: translation.language,
      providerName: translation.providerName,
      categoryName: translation.categoryName,
      gameName: translation.gameName,
      createdAt: translation.createdAt,
      updatedAt: translation.updatedAt,
    };
  }
}

