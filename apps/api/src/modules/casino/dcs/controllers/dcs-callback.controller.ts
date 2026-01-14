import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseFilters,
  UseInterceptors,
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
} from '../dtos/callback.dto';
import { CasinoResponse } from 'src/common/http/decorators/casino-response.decorator';
import { GuestOnly } from 'src/common/auth/decorators/roles.decorator';
import { DcsCallbackService } from '../application/dcs-callback.service';
import { AuditLog } from 'src/modules/audit-log/infrastructure/audit-log.decorator';
import { LogType } from 'src/modules/audit-log/domain';

@ApiTags('DCS Callback')
@Controller('dopaminedev')
@GuestOnly()
@UseFilters() // 글로벌 예외 필터 비활성화
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
    const { brand_id, sign, token, brand_uid, currency } = body;

    const requiredFieldsResponse =
      this.dcsCallbackService.validateRequiredFields(body, [
        'brand_id',
        'sign',
        'token',
        'brand_uid',
        'currency',
      ]);
    if (requiredFieldsResponse) return requiredFieldsResponse;

    const signVerificationResponse = this.dcsCallbackService.verifySign(
      brand_id,
      sign,
      token,
    );
    if (signVerificationResponse) return signVerificationResponse;

    return await this.dcsCallbackService.getBalance(body);
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
    const { brand_id, sign, wager_id } = body;

    const requiredFieldsResponse =
      this.dcsCallbackService.validateRequiredFields(body, [
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
      ]);
    if (requiredFieldsResponse) return requiredFieldsResponse;

    const signVerificationResponse = this.dcsCallbackService.verifySign(
      brand_id,
      sign,
      wager_id,
    );
    if (signVerificationResponse) return signVerificationResponse;

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
    const { brand_id, sign, wager_id } = body;

    const requiredFieldsResponse =
      this.dcsCallbackService.validateRequiredFields(body, [
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
      ]);
    if (requiredFieldsResponse) return requiredFieldsResponse;

    const signVerificationResponse = this.dcsCallbackService.verifySign(
      brand_id,
      sign,
      wager_id,
    );
    if (signVerificationResponse) return signVerificationResponse;

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
    const { brand_id, sign, wager_id } = body;

    const requiredFieldsResponse =
      this.dcsCallbackService.validateRequiredFields(body, [
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
      ]);
    if (requiredFieldsResponse) return requiredFieldsResponse;

    const signVerificationResponse = this.dcsCallbackService.verifySign(
      brand_id,
      sign,
      wager_id,
    );
    if (signVerificationResponse) return signVerificationResponse;

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
    const { brand_id, sign, wager_id } = body;

    const requiredFieldsResponse =
      this.dcsCallbackService.validateRequiredFields(body, [
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
      ]);
    if (requiredFieldsResponse) return requiredFieldsResponse;

    const signVerificationResponse = this.dcsCallbackService.verifySign(
      brand_id,
      sign,
      wager_id,
    );
    if (signVerificationResponse) return signVerificationResponse;

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
    const { brand_id, sign, wager_id } = body;

    const requiredFieldsResponse =
      this.dcsCallbackService.validateRequiredFields(body, [
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
      ]);
    if (requiredFieldsResponse) return requiredFieldsResponse;

    const signVerificationResponse = this.dcsCallbackService.verifySign(
      brand_id,
      sign,
      wager_id,
    );
    if (signVerificationResponse) return signVerificationResponse;

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
      request: args[0],
      response: result,
      statusCode: 200,
    }),
  })
  async getBalance(
    @Body() body: GetDcsBalanceRequestDto,
  ): Promise<GetDcsBalanceResponseDto> {
    const { brand_id, sign, token } = body;

    const requiredFieldsResponse =
      this.dcsCallbackService.validateRequiredFields(body, [
        'brand_id',
        'sign',
        'token',
        'brand_uid',
        'currency',
      ]);
    if (requiredFieldsResponse) return requiredFieldsResponse;

    const signVerificationResponse = this.dcsCallbackService.verifySign(
      brand_id,
      sign,
      token,
    );
    if (signVerificationResponse) return signVerificationResponse;

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
      request: args[0],
      response: result,
      statusCode: 200,
    }),
  })
  async promoPayout(
    @Body() body: PromoPayoutRequestDto,
  ): Promise<PromoPayoutResponseDto> {
    const { brand_id, sign, promotion_id, trans_id } = body;

    const requiredFieldsResponse =
      this.dcsCallbackService.validateRequiredFields(body, [
        'brand_id',
        'sign',
        'brand_uid',
        'currency',
        'amount',
        'promotion_id',
        'trans_id',
        'provider',
        'transaction_time',
      ]);
    if (requiredFieldsResponse) return requiredFieldsResponse;

    const signVerificationResponse = this.dcsCallbackService.verifySign(
      brand_id,
      sign,
      promotion_id,
      trans_id,
    );
    if (signVerificationResponse) return signVerificationResponse;

    return await this.dcsCallbackService.promoPayout(body);
  }
}
