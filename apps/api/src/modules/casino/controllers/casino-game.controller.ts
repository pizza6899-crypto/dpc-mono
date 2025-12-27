import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthAll, Public } from 'src/platform/auth/decorators/roles.decorator';
import {
  ApiPaginatedResponse,
  ApiStandardErrors,
  ApiStandardResponse,
} from 'src/platform/http/decorators/api-response.decorator';
import { CurrentUser } from 'src/platform/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/platform/auth/decorators/current-user.decorator';
import type { PaginatedData, RequestClientInfo } from 'src/platform/http/types';
import { RequestClienttInfo } from 'src/platform/auth/decorators/request-info.decorator';
import { CasinoGameService } from '../application/casino-game.service';
import { GameInfoDto, GameListRequestDto } from '../dtos/game-list.dto';
import {
  GameLaunchRequestDto,
  GameLaunchResponseDto,
} from '../dtos/game-launch.dto';
import { ActivityType } from 'src/platform/activity-log/activity-log.types';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { Throttle } from 'src/platform/throttle/decorators/throttle.decorator';
import { ThrottleScope } from 'src/platform/throttle/types/throttle.types';

@Controller('casino/games')
@ApiTags('Casino Games')
@ApiStandardErrors()
export class CasinoGameController {
  constructor(
    private readonly casinoGameService: CasinoGameService,
    @Inject(ACTIVITY_LOG)
    private readonly activityLog: ActivityLogPort,
  ) {}

  @Post('launch')
  @AuthAll()
  @HttpCode(HttpStatus.OK)
  @Throttle({
    limit: 30,
    ttl: 60, // 1분
    scope: ThrottleScope.USER,
  })
  @ApiOperation({ summary: 'Launch Game (게임 실행)' })
  @ApiStandardResponse(GameLaunchResponseDto, {
    status: 200,
    description: 'Game launch success (게임 실행 성공)',
  })
  async launchGame(
    @CurrentUser() user: CurrentUserWithSession,
    @Body() data: GameLaunchRequestDto,
    @RequestClienttInfo() request: RequestClientInfo,
  ): Promise<GameLaunchResponseDto> {
    try {
      const result = await this.casinoGameService.launchGame(
        user,
        data,
        request,
      );

      // 성공 로그 기록
      await this.activityLog.logSuccess(
        {
          userId: user.id,
          activityType: ActivityType.GAME_LAUNCH,
          description: `게임 실행 - 게임 ID: ${data.gameId}, 모바일: ${data.isMobile}`,
          metadata: {
            gameId: data.gameId,
            isMobile: data.isMobile,
            gameUrl: result.gameUrl,
          },
        },
        request,
      );

      return result;
    } catch (error) {
      // 실패 로그 기록
      await this.activityLog.logFailure(
        {
          userId: user.id,
          activityType: ActivityType.GAME_LAUNCH,
          description: `게임 실행 실패 - 게임 ID: ${data.gameId}, 모바일: ${data.isMobile}`,
          metadata: {
            gameId: data.gameId,
            isMobile: data.isMobile,
            error: error.message,
          },
        },
        request,
      );
      throw error;
    }
  }

  @Get('list')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({
    limit: 100,
    ttl: 60, // 1분
    scope: ThrottleScope.IP,
  })
  @ApiOperation({ summary: 'Get Game List (게임 목록 조회)' })
  @ApiPaginatedResponse(GameInfoDto, {
    status: 200,
    description: 'Game list retrieved successfully (게임 목록 조회 성공)',
  })
  async getGameList(
    @Query() query: GameListRequestDto,
  ): Promise<PaginatedData<GameInfoDto>> {
    return await this.casinoGameService.getGameList(query);
  }
}
