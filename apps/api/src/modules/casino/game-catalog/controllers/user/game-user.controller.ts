import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  Public,
  RequireRoles,
} from 'src/common/auth/decorators/roles.decorator';
import { SqidsService } from 'src/infrastructure/sqids/sqids.service';
import { SqidsPrefix } from 'src/infrastructure/sqids/sqids.constants';
import { FindGamesService } from '../../application/find-games.service';
import { CatalogGameResponseDto } from './dto/response/game.response.dto';
import { GameListRequestDto } from './dto/request/game-list.request.dto';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import {
  ApiPaginatedResponse,
  ApiStandardResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { PaginatedData } from 'src/common/http/types';
import type { RequestClientInfo } from 'src/common/http/types';
import { Language, UserRoleType } from '@prisma/client';
import { GetCategoryByCodeService } from '../../application/get-category-by-code.service';
import { LaunchGameService } from '../../../application/launch-game.service';
import { Throttle } from 'src/common/throttle/decorators/throttle.decorator';
import { ThrottleScope } from 'src/infrastructure/throttle/types/throttle.types';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { LaunchGameRequestDto } from './dto/request/launch-game.request.dto';
import { LaunchGameResponseDto } from './dto/response/launch-game.response.dto';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { RequestClientInfoParam } from 'src/common/auth/decorators/request-info.decorator';

@ApiTags('User Casino Game')
@Controller('casino/games')
export class GameUserController {
  constructor(
    private readonly findGamesService: FindGamesService,
    private readonly getCategoryByCodeService: GetCategoryByCodeService,
    private readonly launchGameService: LaunchGameService,
    private readonly sqidsService: SqidsService,
  ) {}

  @Get()
  @Public()
  @Paginated()
  @ApiOperation({ summary: 'List active and visible games / 게임 목록 조회' })
  @ApiPaginatedResponse(CatalogGameResponseDto)
  async list(
    @Query() query: GameListRequestDto,
  ): Promise<PaginatedData<CatalogGameResponseDto>> {
    const lang = query.language || Language.EN;

    // Handle categoryCode
    let categoryId: bigint | undefined;
    if (query.categoryCode) {
      try {
        const category = await this.getCategoryByCodeService.execute({
          code: query.categoryCode,
        });
        categoryId = category.id ?? undefined;
      } catch (e) {
        // Return empty result if category doesn't exist but was requested
        return {
          data: [],
          page: query.page ?? 1,
          limit: query.limit ?? 30,
          total: 0,
        };
      }
    }

    const result = await this.findGamesService.execute({
      providerCode: query.providerCode,
      categoryId,
      keyword: query.keyword,
      isEnabled: true,
      isVisible: true,
      page: query.page,
      limit: query.limit,
    });

    return {
      data: result.data.map((game) => {
        const translation =
          game.translations.find((t) => t.language === lang) ||
          game.translations.find((t) => t.language === Language.EN) ||
          game.translations[0];
        return {
          id: game.id
            ? this.sqidsService.encode(game.id, SqidsPrefix.CASINO_GAME)
            : '',
          name: translation?.name || game.code,
          thumbnailUrl: game.thumbnailUrl ?? undefined,
          bannerUrl: game.bannerUrl ?? undefined,
          rtp: game.rtp?.toString(),
          volatility: game.volatility ?? undefined,
          gameType: game.gameType ?? undefined,
        };
      }),
      page: result.page,
      limit: result.limit,
      total: result.total,
    };
  }

  @Post('launch')
  @RequireRoles(
    UserRoleType.USER,
    UserRoleType.AGENT,
    UserRoleType.ADMIN,
    UserRoleType.SUPER_ADMIN,
  )
  @HttpCode(HttpStatus.OK)
  @Throttle({
    limit: 30,
    ttl: 60, // 1 minute
    scope: ThrottleScope.USER,
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    category: 'CASINO',
    action: 'LAUNCH_GAME',
    extractMetadata: (_, args) => ({
      id: args[1]?.gameId,
      isMobile: args[1]?.isMobile,
      walletCurrency: args[0]?.primaryCurrency,
      gameCurrency: args[0]?.playCurrency,
      language: args[0]?.language,
    }),
  })
  @ApiOperation({ summary: 'Launch Game (게임 실행)' })
  @ApiStandardResponse(LaunchGameResponseDto, {
    status: 200,
    description: 'Game launch success',
  })
  async launchGame(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LaunchGameRequestDto,
    @RequestClientInfoParam() request: RequestClientInfo,
  ): Promise<LaunchGameResponseDto> {
    const decodedId = this.sqidsService.decode(
      dto.gameId,
      SqidsPrefix.CASINO_GAME,
    );

    const result = await this.launchGameService.execute(
      user,
      {
        gameId: BigInt(decodedId),
        isMobile: dto.isMobile,
        walletCurrency: user.primaryCurrency as any,
        gameCurrency: user.playCurrency as any,
        language: user.language,
      },
      request,
    );

    return result;
  }
}
