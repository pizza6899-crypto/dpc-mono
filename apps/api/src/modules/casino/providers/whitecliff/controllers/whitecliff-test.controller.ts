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
  ProductGameListResponse,
  PushedBetHistoryResponse,
} from '../infrastructure/whitecliff-api.service';
import { GAMING_CURRENCIES } from 'src/utils/currency.util';
import type { GamingCurrencyCode } from 'src/utils/currency.util';

@Controller('whitecliff/test')
@ApiTags('Whitecliff Test')
@ApiStandardErrors()
@Public()
export class WhitecliffTestController {
  constructor(
    private readonly whitecliffApiService: WhitecliffApiService,
  ) { }
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
}
