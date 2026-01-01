// src/modules/casino-refactor/aggregator/wc/controllers/user/wc-callback.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
  UseFilters,
  UseInterceptors,
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
} from 'src/modules/casino/whitecliff/dtos';
import { CasinoResponse } from 'src/common/http/decorators/casino-response.decorator';
import { GuestOnly } from 'src/common/auth/decorators/roles.decorator';
import { WhitecliffLoggingInterceptor } from 'src/modules/casino/whitecliff/infrastructure/whitecliff-logging.interceptor';
import { WcCallbackService } from '../../application/wc-callback.service';

@ApiTags('WC Callback (Whitecliff 콜백)')
@Controller('dopaminedev')
@GuestOnly()
@UseFilters() // 글로벌 예외 필터 비활성화
@UseInterceptors(WhitecliffLoggingInterceptor)
export class WcCallbackController {
  constructor(private readonly wcCallbackService: WcCallbackService) {}

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
    // 비밀키 검증
    const { isValid, currency } =
      this.wcCallbackService.validateSecretKey(secretKey);
    if (!isValid) {
      return {
        status: 0,
        balance: 0,
        error: 'ACCESS_DENIED',
      };
    }

    return this.wcCallbackService.getBalance(body, currency);
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
    // 비밀키 검증
    const { isValid, currency } =
      this.wcCallbackService.validateSecretKey(secretKey);
    if (!isValid) {
      return {
        status: 0,
        balance: 0,
        error: 'ACCESS_DENIED',
      };
    }

    // 서비스 호출
    return this.wcCallbackService.debit(body, currency);
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
    // 비밀키 검증
    const { isValid, currency } =
      this.wcCallbackService.validateSecretKey(secretKey);
    if (!isValid) {
      return {
        status: 0,
        balance: 0,
        error: 'ACCESS_DENIED',
      };
    }

    // 서비스 호출
    return this.wcCallbackService.credit(body, currency);
  }

  @Post('/bonus')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '사용자 보너스 조회' })
  @CasinoResponse(GetBonusResponseDto, { description: '보너스 조회 성공' })
  async getBonus(
    @Headers('secret-key') secretKey: string,
    @Body() body: GetBonusRequestDto,
  ): Promise<GetBonusResponseDto> {
    // 비밀키 검증
    const { isValid, currency } =
      this.wcCallbackService.validateSecretKey(secretKey);
    if (!isValid) {
      return {
        status: 0,
        balance: 0,
        error: 'ACCESS_DENIED',
      };
    }

    // 서비스 호출
    return this.wcCallbackService.getBonus(body, currency);
  }
}

