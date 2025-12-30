import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiQuery } from '@nestjs/swagger';
import { Public } from 'src/common/auth/decorators/roles.decorator';
import {
  ApiStandardErrors,
  ApiStandardResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { WhitecliffApiService } from '../infrastructure/whitecliff-api.service';
import { Language } from '@repo/database';
import {
  WhitecliffGameLaunchResponse,
  TransactionResultsResponse,
  ProductGameListResponse,
  PushedBetHistoryResponse,
} from '../infrastructure/whitecliff-api.service';
import { WhitecliffGameRefreshService } from '../application/whitecliff-game-refresh.service';
import {
  GameListUpdateResponseDto,
  GameListUpdateStatusDto,
  GameListUpdateRequestDto,
} from '../dtos/game-update.dto';
import { GAMING_CURRENCIES } from 'src/utils/currency.util';
import type { GamingCurrencyCode } from 'src/utils/currency.util';

@Controller('whitecliff/test')
@ApiTags('Whitecliff Test (임시 테스트용)')
@ApiStandardErrors()
@Public()
export class WhitecliffTestController {
  constructor(
    private readonly whitecliffApiService: WhitecliffApiService,
    private readonly whitecliffGameRefreshService: WhitecliffGameRefreshService,
  ) {}
  @Get('getBetResults')
  @ApiOperation({ summary: '베팅 결과 재확인 테스트' })
  @ApiQuery({
    name: 'gameCurrency',
    enum: GAMING_CURRENCIES,
    description: '통화',
  })
  @ApiQuery({ name: 'prdId', type: Number, description: '게임 상품 ID' })
  @ApiQuery({ name: 'txnId', type: String, description: '트랜잭션 ID' })
  async getBetResults(
    @Query('gameCurrency') gameCurrency: GamingCurrencyCode,
    @Query('prdId') prdId: number,
    @Query('txnId') txnId: string,
  ): Promise<
    | {
        status: number;
        type: number;
        game_id: number;
        stake: number;
        payout: number;
        is_cancel: number;
        credit_time: string;
        error: string;
      }
    | { status: number; error: string; message?: string }
  > {
    return this.whitecliffApiService.getBetResults(gameCurrency, prdId, txnId);
  }

  // @Post('getTransactionResults')
  // @ApiOperation({ summary: '트랜잭션 결과 조회 테스트' })
  // @ApiBody({
  //   description: '트랜잭션 결과 조회 요청 데이터',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       currency: {
  //         type: 'string',
  //         enum: Object.values(Currency),
  //         description: '통화',
  //       },
  //       lang: {
  //         type: 'string',
  //         enum: Object.values(Language),
  //         description: '언어',
  //       },
  //       prd_id: { type: 'number', description: '게임 상품 ID' },
  //       txn_id: { type: 'string', description: '트랜잭션 ID' },
  //     },
  //     required: ['currency', 'lang', 'prd_id', 'txn_id'],
  //   },
  // })
  // async getTransactionResults(
  //   @Body()
  //   body: {
  //     currency: Currency;
  //     lang: Language;
  //     prd_id: number;
  //     txn_id: string;
  //   },
  // ): Promise<
  //   | TransactionResultsResponse
  //   | { status: number; error: string; message?: string }
  // > {
  //   return this.whitecliffApiService.getTransactionResults({
  //     currency: body.currency,
  //     lang: body.lang,
  //     provider: body.provider as GameProvider,
  //     txn_id: body.txn_id,
  //   });
  // }

  @Post('getProductGameList')
  @ApiOperation({ summary: '게임 리스트 조회 테스트' })
  @ApiBody({
    description: '게임 리스트 조회 요청 데이터',
    schema: {
      type: 'object',
      properties: {
        gameCurrency: {
          type: 'string',
          enum: Object.values(GAMING_CURRENCIES),
          description: '통화',
        },
        language: {
          type: 'string',
          enum: Object.values(Language),
          description: '언어',
        },
        prd_id: { type: 'number', description: '게임 상품 ID (선택사항)' },
      },
      required: ['currency', 'language'],
    },
  })
  async getProductGameList(
    @Body()
    body: {
      gameCurrency: GamingCurrencyCode;
      language: Language;
      prd_id?: number;
    },
  ): Promise<
    | ProductGameListResponse
    | { status: number; error: string; message?: string }
  > {
    return this.whitecliffApiService.getProductGameList(body);
  }

  @Post('getPushedBetHistory')
  @ApiOperation({ summary: '푸시 베팅 내역 조회 테스트' })
  @ApiBody({
    description: '푸시 베팅 내역 조회 요청 데이터',
    schema: {
      type: 'object',
      properties: {
        gameCurrency: {
          type: 'string',
          enum: Object.values(GAMING_CURRENCIES),
          description: '통화',
        },
        prd_id: { type: 'number', description: '게임 상품 ID' },
        start_date: {
          type: 'string',
          description: '시작 날짜 (YYYY-MM-DD 형식)',
        },
        end_date: {
          type: 'string',
          description: '종료 날짜 (YYYY-MM-DD 형식)',
        },
      },
      required: ['currency', 'prd_id', 'start_date', 'end_date'],
    },
  })
  async getPushedBetHistory(
    @Body()
    body: {
      gameCurrency: GamingCurrencyCode;
      prd_id: number;
      start_date: string;
      end_date: string;
    },
  ): Promise<
    | PushedBetHistoryResponse
    | { status: number; error: string; message?: string }
  > {
    return this.whitecliffApiService.getPushedBetHistory(body);
  }

  // ========== 게임 목록 갱신 테스트 ==========

  @Post('refresh-game-list')
  @ApiOperation({
    summary: '[TEST] 게임 목록 갱신 테스트',
    description: 'mock2 데이터를 사용하여 게임 목록 갱신을 테스트합니다.',
  })
  @ApiBody({
    description: '게임 목록 갱신 요청 데이터',
    schema: {
      type: 'object',
      properties: {
        language: {
          type: 'string',
          description: '언어 코드 (예: en, ko)',
          example: 'en',
        },
      },
      required: ['language'],
    },
  })
  @ApiStandardResponse(GameListUpdateResponseDto, {
    status: 200,
    description: '게임 목록 갱신 시작',
  })
  async refreshGameList(
    @Body() body: { language: string },
  ): Promise<GameListUpdateResponseDto> {
    return this.whitecliffGameRefreshService.updateGameListManually(
      body.language,
    );
  }

  @Get('refresh-status')
  @ApiOperation({
    summary: '[TEST] 게임 목록 갱신 상태 조회',
    description: '현재 게임 목록 갱신 진행 상태를 조회합니다.',
  })
  @ApiStandardResponse(GameListUpdateStatusDto, {
    status: 200,
    description: '상태 조회 성공',
  })
  async getRefreshStatus(): Promise<GameListUpdateStatusDto> {
    return this.whitecliffGameRefreshService.getUpdateStatus();
  }
}
