import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { CasinoResponse } from 'src/common/http/decorators/casino-response.decorator';
import { GuestOnly } from 'src/common/auth/decorators/roles.decorator';
import {
  DcLoginRequestDto,
  DcLoginResponseDto,
  DcWagerRequestDto,
  DcWagerResponseDto,
  DcCancelWagerRequestDto,
  DcCancelWagerResponseDto,
  DcAppendWagerRequestDto,
  DcAppendWagerResponseDto,
  DcEndWagerRequestDto,
  DcEndWagerResponseDto,
  DcFreeSpinResultRequestDto,
  DcFreeSpinResultResponseDto,
  GetDcBalanceRequestDto,
  GetDcBalanceResponseDto,
  DcPromoPayoutRequestDto,
  DcPromoPayoutResponseDto,
} from '../dtos/callback.dto';
import { DcCallbackValidationGuard } from '../guards/dc-callback-validation.guard';
import { DcCallbackExceptionFilter } from '../filters/dc-callback-exception.filter';
import { ValidateDcCallback } from '../decorators/validate-dc-callback.decorator';
import { DcAuditLogInterceptor } from '../interceptors/dc-audit-log.interceptor';

@ApiTags('DC Callback(콜백)')
@Controller('dopaminedev')
@GuestOnly()
@UseGuards(DcCallbackValidationGuard)
@UseFilters(DcCallbackExceptionFilter)
@UseInterceptors(DcAuditLogInterceptor)
export class DcCallbackController {
  constructor(
  ) {}

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그인 콜백' })
  @ApiBody({ type: DcLoginRequestDto })
  @CasinoResponse(DcLoginResponseDto, { description: '로그인 성공' })
  @ValidateDcCallback(
    ['brand_id', 'sign', 'token', 'brand_uid', 'currency'],
    ['token'],
  )
  async login(@Body() body: DcLoginRequestDto): Promise<DcLoginResponseDto> {
    // return await this.getBalanceUseCase.execute(body);
    throw new Error('Not implemented');
  }

  @Post('/wager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '베팅 콜백' })
  @ApiBody({ type: DcWagerRequestDto })
  @CasinoResponse(DcWagerResponseDto, { description: '베팅 성공' })
  @ValidateDcCallback(
    [
      'brand_id',
      'sign',
      'token',
      'brand_uid',
      'currency',
      'amount',
      'jackpot_contribution',
      'game_id',
      'game_name',
      'round_id',
      'wager_id',
      'provider',
      'bet_type',
      'transaction_time',
      'is_endround',
    ],
    ['wager_id'],
  )
  async wager(@Body() body: DcWagerRequestDto): Promise<DcWagerResponseDto> {
    // return await this.wagerUseCase.execute(body);
    throw new Error('Not implemented');
  }

  @Post('/cancelWager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '베팅 취소 콜백' })
  @ApiBody({ type: DcCancelWagerRequestDto })
  @CasinoResponse(DcCancelWagerResponseDto, { description: '베팅 취소 성공' })
  @ValidateDcCallback(
    [
      'brand_id',
      'sign',
      'brand_uid',
      'currency',
      'round_id',
      'wager_id',
      'provider',
      'wager_type',
      'is_endround',
      'transaction_time',
    ],
    ['wager_id'],
  )
  async cancelWager(
    @Body() body: DcCancelWagerRequestDto,
  ): Promise<DcCancelWagerResponseDto> {
    // return await this.cancelWagerUseCase.execute(body);
    throw new Error('Not implemented');
  }

  @Post('/appendWager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '추가 베팅 콜백' })
  @ApiBody({ type: DcAppendWagerRequestDto })
  @CasinoResponse(DcAppendWagerResponseDto, { description: '추가 베팅 성공' })
  @ValidateDcCallback(
    [
      'brand_id',
      'sign',
      'brand_uid',
      'currency',
      'amount',
      'game_id',
      'game_name',
      'round_id',
      'wager_id',
      'provider',
      'description',
      'is_endround',
      'transaction_time',
    ],
    ['wager_id'],
  )
  async appendWager(
    @Body() body: DcAppendWagerRequestDto,
  ): Promise<DcAppendWagerResponseDto> {
    // return await this.appendWagerUseCase.execute(body);
    throw new Error('Not implemented');
  }

  @Post('/endWager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '베팅 종료 및 지급 콜백' })
  @ApiBody({ type: DcEndWagerRequestDto })
  @CasinoResponse(DcEndWagerResponseDto, { description: '베팅 종료 성공' })
  @ValidateDcCallback(
    [
      'brand_id',
      'sign',
      'brand_uid',
      'currency',
      'round_id',
      'provider',
      'is_endround',
      'amount',
      'wager_id',
      'transaction_time',
    ],
    ['wager_id'],
  )
  async endWager(
    @Body() body: DcEndWagerRequestDto,
  ): Promise<DcEndWagerResponseDto> {
    // return await this.endWagerUseCase.execute(body);
    throw new Error('Not implemented');
  }

  @Post('/freeSpinResult')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '무료 스핀 결과 콜백' })
  @ApiBody({ type: DcFreeSpinResultRequestDto })
  @CasinoResponse(DcFreeSpinResultResponseDto, {
    description: '무료 스핀 결과 처리 성공',
  })
  @ValidateDcCallback(
    [
      'brand_id',
      'sign',
      'brand_uid',
      'currency',
      'round_id',
      'wager_id',
      'provider',
      'is_endround',
      'transaction_time',
      'amount',
      'game_id',
      'game_name',
    ],
    ['wager_id'],
  )
  async freeSpinResult(
    @Body() body: DcFreeSpinResultRequestDto,
  ): Promise<DcFreeSpinResultResponseDto> {
    // return await this.freeSpinResultUseCase.execute(body);
    throw new Error('Not implemented');
  }

  @Post('/getBalance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '잔액 조회 콜백' })
  @ApiBody({ type: GetDcBalanceRequestDto })
  @CasinoResponse(GetDcBalanceResponseDto, { description: '잔액 조회 성공' })
  @ValidateDcCallback(
    ['brand_id', 'sign', 'token', 'brand_uid', 'currency'],
    ['token'],
  )
  async getBalance(
    @Body() body: GetDcBalanceRequestDto,
  ): Promise<GetDcBalanceResponseDto> {
    // return await this.getBalanceUseCase.execute(body);
    throw new Error('Not implemented');
  }

  @Post('/promoPayout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '프로모션 지급 콜백' })
  @ApiBody({ type: DcPromoPayoutRequestDto })
  @CasinoResponse(DcPromoPayoutResponseDto, { description: '프로모션 지급 성공' })
  @ValidateDcCallback(
    [
      'brand_id',
      'sign',
      'brand_uid',
      'currency',
      'amount',
      'promotion_id',
      'trans_id',
      'provider',
      'transaction_time',
    ],
    ['promotion_id', 'trans_id'],
  )
  async promoPayout(
    @Body() body: DcPromoPayoutRequestDto,
  ): Promise<DcPromoPayoutResponseDto> {
    // return await this.promoPayoutUseCase.execute(body);
    throw new Error('Not implemented');
  }
}

