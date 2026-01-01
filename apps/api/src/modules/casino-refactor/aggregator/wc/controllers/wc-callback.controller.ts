// src/modules/casino-refactor/aggregator/wc/controllers/wc-callback.controller.ts

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
  UseFilters,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import {
  GetWhitecliffBalanceRequestDto,
  GetWhitecliffBalanceResponseDto,
  DebitRequestDto,
  CreditRequestDto,
  TransactionResponseDto,
  GetBonusRequestDto,
  GetBonusResponseDto,
} from '../../../../casino/whitecliff/dtos';
import { CasinoResponse } from 'src/common/http/decorators/casino-response.decorator';
import { GuestOnly } from 'src/common/auth/decorators/roles.decorator';

@ApiTags('WC Callback(콜백)')
@Controller('dopaminedev-refactor')
@GuestOnly()
@UseFilters() // 글로벌 예외 필터 비활성화
export class WcCallbackController {
  constructor(
    // TODO: Service 의존성 주입 예정
  ) {}

  @Post('/balance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '사용자 잔액 조회' })
  @ApiBody({ type: GetWhitecliffBalanceRequestDto })
  @CasinoResponse(GetWhitecliffBalanceResponseDto, {
    description: '잔액 조회 성공',
  })
  async getBalance(
    @Headers('secret-key') secretKey: string,
    @Body() body: GetWhitecliffBalanceRequestDto,
  ): Promise<GetWhitecliffBalanceResponseDto> {
    // TODO: 로직 구현 예정
    throw new Error('Not implemented');
  }

  @Post('/debit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '사용자 잔액 차감' })
  @ApiBody({ type: DebitRequestDto })
  @CasinoResponse(TransactionResponseDto, { description: '차감 성공' })
  async debit(
    @Headers('secret-key') secretKey: string,
    @Body() body: DebitRequestDto,
  ): Promise<TransactionResponseDto> {
    // TODO: 로직 구현 예정
    throw new Error('Not implemented');
  }

  @Post('/credit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '사용자 잔액 추가' })
  @ApiBody({ type: CreditRequestDto })
  @CasinoResponse(TransactionResponseDto, { description: '추가 성공' })
  async credit(
    @Headers('secret-key') secretKey: string,
    @Body() body: CreditRequestDto,
  ): Promise<TransactionResponseDto> {
    // TODO: 로직 구현 예정
    throw new Error('Not implemented');
  }

  @Post('/bonus')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '사용자 보너스 조회' })
  @ApiBody({ type: GetBonusRequestDto })
  @CasinoResponse(GetBonusResponseDto, { description: '보너스 조회 성공' })
  async getBonus(
    @Headers('secret-key') secretKey: string,
    @Body() body: GetBonusRequestDto,
  ): Promise<GetBonusResponseDto> {
    // TODO: 로직 구현 예정
    throw new Error('Not implemented');
  }
}

