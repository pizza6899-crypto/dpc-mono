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
import { AuthAll, Public } from 'src/common/auth/decorators/roles.decorator';
import {
  ApiPaginatedResponse,
  ApiStandardErrors,
  ApiStandardResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import type { PaginatedData, RequestClientInfo } from 'src/common/http/types';
import { RequestClientInfoParam } from 'src/common/auth/decorators/request-info.decorator';
import { CasinoGameService } from '../application/casino-game.service';
import { GameInfoDto, GameListRequestDto } from '../dtos/game-list.dto';
import {
  GameLaunchRequestDto,
  GameLaunchResponseDto,
} from '../dtos/game-launch.dto';
import { Throttle } from 'src/common/throttle/decorators/throttle.decorator';
import { ThrottleScope } from 'src/common/throttle/types/throttle.types';

@Controller('casino/games')
@ApiTags('Casino Games')
@ApiStandardErrors()
export class CasinoGameController {
  constructor(
    private readonly casinoGameService: CasinoGameService,
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
    @RequestClientInfoParam() request: RequestClientInfo,
  ): Promise<GameLaunchResponseDto> {
    try {
      const result = await this.casinoGameService.launchGame(
        user,
        data,
        request,
      );

      return result;
    } catch (error) {
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
