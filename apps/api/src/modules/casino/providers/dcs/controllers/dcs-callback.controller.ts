import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseFilters,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import {
  LoginRequestDto,
  DcsLoginResponseDto,
  WagerRequestDto,
  WagerResponseDto,
  CancelWagerRequestDto,
  CancelWagerResponseDto,
  AppendWagerRequestDto,
  AppendWagerResponseDto,
  EndWagerRequestDto,
  EndWagerResponseDto,
  FreeSpinResultRequestDto,
  FreeSpinResultResponseDto,
  GetDcsBalanceRequestDto,
  GetDcsBalanceResponseDto,
  PromoPayoutRequestDto,
  PromoPayoutResponseDto,
} from '../dtos';
import { CasinoResponse } from 'src/common/http/decorators/casino-response.decorator';
import { GuestOnly } from 'src/common/auth/decorators/roles.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';
import { DcsCallbackService } from '../application/dcs-callback.service';

import { DcsValidationPipe } from '../infrastructure/dcs-validation.pipe';
import { DcsExceptionFilter } from '../infrastructure/dcs-exception.filter';

@ApiTags('DCS Callback')
@Controller('dopaminedev')
@GuestOnly()
@UseFilters(DcsExceptionFilter)
@UsePipes(new DcsValidationPipe())
export class DcsCallbackController {
  constructor(private readonly dcsCallbackService: DcsCallbackService) { }

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그인 콜백' })
  @ApiBody({ type: LoginRequestDto })
  @CasinoResponse(DcsLoginResponseDto, { description: '로그인 성공' })
  @AuditLog({
    type: LogType.INTEGRATION,
    action: 'DCS_CALLBACK_LOGIN',
    extractMetadata: (req, args, result) => ({
      provider: 'DCS',
      method: 'POST',
      endpoint: req.url,
      request: req.body,
      response: result,
      statusCode: 200,
    }),
  })
  async login(@Body() body: LoginRequestDto): Promise<DcsLoginResponseDto> {
    return await this.dcsCallbackService.login(body);
  }

  @Post('/wager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '베팅 콜백' })
  @ApiBody({ type: WagerRequestDto })
  @CasinoResponse(WagerResponseDto, { description: '베팅 성공' })
  @AuditLog({
    type: LogType.INTEGRATION,
    action: 'DCS_CALLBACK_WAGER',
    extractMetadata: (req, args, result) => ({
      provider: 'DCS',
      method: 'POST',
      endpoint: req.url,
      request: req.body,
      response: result,
      statusCode: 200,
    }),
  })
  async wager(@Body() body: WagerRequestDto): Promise<WagerResponseDto> {
    return await this.dcsCallbackService.wager(body);
  }

  @Post('/cancelWager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '베팅 취소 콜백' })
  @ApiBody({ type: CancelWagerRequestDto })
  @CasinoResponse(CancelWagerResponseDto, { description: '베팅 취소 성공' })
  @AuditLog({
    type: LogType.INTEGRATION,
    action: 'DCS_CALLBACK_CANCEL_WAGER',
    extractMetadata: (req, args, result) => ({
      provider: 'DCS',
      method: 'POST',
      endpoint: req.url,
      request: req.body,
      response: result,
      statusCode: 200,
    }),
  })
  async cancelWager(
    @Body() body: CancelWagerRequestDto,
  ): Promise<CancelWagerResponseDto> {
    return await this.dcsCallbackService.cancelWager(body);
  }

  @Post('/appendWager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '추가 베팅 콜백' })
  @ApiBody({ type: AppendWagerRequestDto })
  @CasinoResponse(AppendWagerResponseDto, { description: '추가 베팅 성공' })
  @AuditLog({
    type: LogType.INTEGRATION,
    action: 'DCS_CALLBACK_APPEND_WAGER',
    extractMetadata: (req, args, result) => ({
      provider: 'DCS',
      method: 'POST',
      endpoint: req.url,
      request: req.body,
      response: result,
      statusCode: 200,
    }),
  })
  async appendWager(
    @Body() body: AppendWagerRequestDto,
  ): Promise<AppendWagerResponseDto> {
    return await this.dcsCallbackService.appendWager(body);
  }

  @Post('/endWager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '베팅 종료 및 지급 콜백' })
  @ApiBody({ type: EndWagerRequestDto })
  @CasinoResponse(EndWagerResponseDto, { description: '베팅 종료 성공' })
  @AuditLog({
    type: LogType.INTEGRATION,
    action: 'DCS_CALLBACK_END_WAGER',
    extractMetadata: (req, args, result) => ({
      provider: 'DCS',
      method: 'POST',
      endpoint: req.url,
      request: req.body,
      response: result,
      statusCode: 200,
    }),
  })
  async endWager(
    @Body() body: EndWagerRequestDto,
  ): Promise<EndWagerResponseDto> {
    return await this.dcsCallbackService.endWager(body);
  }

  @Post('/freeSpinResult')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '무료 스핀 결과 콜백' })
  @ApiBody({ type: FreeSpinResultRequestDto })
  @CasinoResponse(FreeSpinResultResponseDto, {
    description: '무료 스핀 결과 처리 성공',
  })
  @AuditLog({
    type: LogType.INTEGRATION,
    action: 'DCS_CALLBACK_FREE_SPIN_RESULT',
    extractMetadata: (req, args, result) => ({
      provider: 'DCS',
      method: 'POST',
      endpoint: req.url,
      request: req.body,
      response: result,
      statusCode: 200,
    }),
  })
  async freeSpinResult(
    @Body() body: FreeSpinResultRequestDto,
  ): Promise<FreeSpinResultResponseDto> {
    return await this.dcsCallbackService.freeSpinResult(body);
  }

  @Post('/getBalance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '잔액 조회 콜백' })
  @ApiBody({ type: GetDcsBalanceRequestDto })
  @CasinoResponse(GetDcsBalanceResponseDto, { description: '잔액 조회 성공' })
  @AuditLog({
    type: LogType.INTEGRATION,
    action: 'DCS_CALLBACK_GET_BALANCE',
    extractMetadata: (req, args, result) => ({
      provider: 'DCS',
      method: 'POST',
      endpoint: req.url,
      request: req.body,
      response: result,
      statusCode: 200,
    }),
  })
  async getBalance(
    @Body() body: GetDcsBalanceRequestDto,
  ): Promise<GetDcsBalanceResponseDto> {
    return await this.dcsCallbackService.getBalance(body);
  }

  @Post('/promoPayout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '프로모션 지급 콜백' })
  @ApiBody({ type: PromoPayoutRequestDto })
  @CasinoResponse(PromoPayoutResponseDto, { description: '프로모션 지급 성공' })
  @AuditLog({
    type: LogType.INTEGRATION,
    action: 'DCS_CALLBACK_PROMO_PAYOUT',
    extractMetadata: (req, args, result) => ({
      provider: 'DCS',
      method: 'POST',
      endpoint: req.url,
      request: req.body,
      response: result,
      statusCode: 200,
    }),
  })
  async promoPayout(
    @Body() body: PromoPayoutRequestDto,
  ): Promise<PromoPayoutResponseDto> {
    return await this.dcsCallbackService.promoPayout(body);
  }
}
