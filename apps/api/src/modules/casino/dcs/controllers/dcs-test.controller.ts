import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { Public } from 'src/platform/auth/decorators/roles.decorator';
import { ApiStandardErrors } from 'src/platform/http/decorators/api-response.decorator';
import { DcsApiService } from '../infrastructure/dcs-api.service';
import { DcsGameRefreshService } from '../application/dcs-game-refresh.service';
import { GameProvider } from '@prisma/client';
import { GamingCurrencyCode } from 'src/utils/currency.util';

@Controller('dcs/test')
@ApiTags('DCS Test (임시 테스트용)')
@ApiStandardErrors()
@Public()
export class DcsTestController {
  constructor(
    private readonly dcsApiService: DcsApiService,
    private readonly dcsGameRefreshService: DcsGameRefreshService,
  ) {}

  @Post('loginGame')
  @ApiOperation({ summary: '게임 로그인 테스트' })
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'dcsUserId',
        'dcsUserToken',
        'gameId',
        'currency',
        'language',
        'country_code',
        'channel',
      ],
      properties: {
        dcsUserId: {
          type: 'string',
          description: 'DCS 사용자 ID',
          example: 'user123',
        },
        dcsUserToken: {
          type: 'string',
          description: 'DCS 사용자 토큰',
          example: 'token123',
        },
        gameId: {
          type: 'number',
          description: '게임 ID',
          example: 1001,
        },
        currency: {
          type: 'string',
          description: '통화',
          example: 'USD',
        },
        language: {
          type: 'string',
          description: '언어',
          example: 'en',
        },
        country_code: {
          type: 'string',
          description: '국가 코드',
          example: 'US',
        },
        channel: {
          type: 'string',
          description: '채널',
          example: 'web',
        },
        return_url: {
          type: 'string',
          description: '리턴 URL (선택)',
          example: 'https://example.com/return',
          nullable: true,
        },
        full_screen: {
          type: 'boolean',
          description: '전체 화면 모드 (선택)',
          example: true,
          nullable: true,
        },
      },
    },
  })
  async loginGame(
    @Body()
    body: {
      dcsUserId: string;
      dcsUserToken: string;
      gameId: number;
      gameCurrency: GamingCurrencyCode;
      language: string;
      country_code: string;
      channel: string;
      return_url?: string;
      full_screen?: boolean;
    },
  ) {
    return this.dcsApiService.loginGame({
      dcsUserId: body.dcsUserId,
      dcsUserToken: body.dcsUserToken,
      gameId: body.gameId,
      gameCurrency: body.gameCurrency,
      language: body.language,
      country_code: body.country_code,
      channel: body.channel,
      return_url: body.return_url,
      full_screen: body.full_screen,
    });
  }

  @Post('tryGame')
  @ApiOperation({ summary: '게임 체험 테스트' })
  async tryGame(
    @Body()
    body: {
      gameId: number;
      gameCurrency: GamingCurrencyCode;
      language: string;
      channel: string;
      return_url?: string;
      full_screen?: boolean;
    },
  ) {
    return this.dcsApiService.tryGame(body);
  }

  @Get('getBetData')
  @ApiOperation({ summary: '베팅 데이터 조회 테스트' })
  async getBetData(
    @Query('page') page: number,
    @Query('start_time') start_time: string,
    @Query('end_time') end_time: string,
    @Query('gameCurrency') gameCurrency: string,
    @Query('provider') provider: string,
    @Query('brand_uid') brand_uid: string,
  ) {
    return this.dcsApiService.getBetData({
      page,
      start_time,
      end_time,
      gameCurrency: gameCurrency as GamingCurrencyCode,
      provider,
      brand_uid,
    });
  }

  @Get('getReplay')
  @ApiOperation({ summary: '게임 리플레이 조회 테스트' })
  async getReplay(
    @Query('brand_uid') brand_uid: string,
    @Query('gameCurrency') gameCurrency: string,
    @Query('provider') provider: string,
    @Query('round_id') round_id: string,
  ) {
    return this.dcsApiService.getReplay({
      brand_uid,
      gameCurrency: gameCurrency as GamingCurrencyCode,
      provider: provider as GameProvider,
      round_id,
    });
  }

  @Get('getGameList')
  @ApiOperation({
    summary: '게임 목록 조회 테스트',
    description:
      'provider: 게임 공급자(PG)에 따라 다름 (예: RELAX_GAMING, PLAYNGO 등)',
  })
  async getGameList(@Query('provider') provider: GameProvider) {
    return this.dcsApiService.getGameList({ provider });
  }

  @Post('createFreeSpin')
  @ApiOperation({ summary: '무료 스핀 생성 테스트' })
  async createFreeSpin(
    @Body()
    body: {
      game_id: number;
      gameCurrency: GamingCurrencyCode;
      end_time: string;
      description?: string;
    },
  ) {
    return this.dcsApiService.createFreeSpin({
      game_id: body.game_id,
      gameCurrency: body.gameCurrency,
      end_time: body.end_time,
      description: body.description,
    });
  }

  @Post('addFreeSpin')
  @ApiOperation({ summary: '무료 스핀 추가 테스트' })
  async addFreeSpin(
    @Body()
    body: {
      freespin_id: number;
      round_count: number;
      amount: number;
      brand_uids: string[];
    },
  ) {
    return this.dcsApiService.addFreeSpin({
      freespin_id: body.freespin_id,
      round_count: body.round_count,
      amount: body.amount,
      brand_uids: body.brand_uids,
    });
  }

  @Get('queryFreeSpin')
  @ApiOperation({ summary: '무료 스핀 조회 테스트' })
  async queryFreeSpin(
    @Query('game_id') game_id: number,
    @Query('gameCurrency') gameCurrency: string,
    @Query('freespin_id') freespin_id: number,
    @Query('brand_uid') brand_uid: string,
    @Query('start_after') start_after: string,
    @Query('end_before') end_before: string,
  ) {
    return this.dcsApiService.queryFreeSpin({
      game_id,
      gameCurrency: gameCurrency as GamingCurrencyCode,
      freespin_id,
      brand_uid,
      start_after,
      end_before,
    });
  }

  @Get('getUsersBetSummary')
  @ApiOperation({ summary: '사용자 베팅 요약 조회 테스트' })
  async getUsersBetSummary(
    @Query('page') page: number,
    @Query('date') date: string,
    @Query('provider') provider: string,
    @Query('brand_uid') brand_uid: string,
  ) {
    return this.dcsApiService.getUsersBetSummary({
      page,
      date,
      provider,
      brand_uid,
    });
  }

  @Post('updateGameList')
  @ApiOperation({
    summary: '게임 목록 업데이트 테스트',
    description:
      'DCS API에서 게임 목록을 가져와 데이터베이스를 업데이트합니다. provider와 language가 필요합니다.',
  })
  async updateGameList(
    @Body()
    body: {
      provider: GameProvider;
      language: string;
    },
  ) {
    this.dcsGameRefreshService.updateGameListManually();

    return {
      success: true,
      message: '게임 목록 업데이트 완료',
    };
  }
}
