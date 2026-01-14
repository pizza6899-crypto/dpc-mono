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
} from '../dtos';
import { CasinoResponse } from '../../../../common/http/decorators/casino-response.decorator';
import { GuestOnly } from 'src/common/auth/decorators/roles.decorator';
import { WhitecliffCallbackService } from '../application/whitecliff-callback.service';
import { AuditLog } from '../../../audit-log/infrastructure/audit-log.decorator';
import { getWhitecliffAuditOptions } from '../infrastructure/whitecliff-audit.util';

@ApiTags('Whitecliff Callback')
@Controller('dopaminedev')
@GuestOnly()
@UseFilters() // 글로벌 예외 필터 비활성화
export class WhitecliffCallbackController {
  constructor(
    private readonly whitecliffCallbackService: WhitecliffCallbackService,
  ) { }

  @Post('/balance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '사용자 잔액 조회' })
  @ApiBody({ type: GetWhitecliffBalanceRequestDto })
  @CasinoResponse(GetWhitecliffBalanceResponseDto, {
    description: '잔액 조회 성공',
  })
  @AuditLog(getWhitecliffAuditOptions('GET_BALANCE'))
  async getBalance(
    @Headers('secret-key') secretKey: string,
    @Body() body: GetWhitecliffBalanceRequestDto,
  ): Promise<GetWhitecliffBalanceResponseDto> {
    // 비밀키 검증
    const { isValid, currency } =
      this.whitecliffCallbackService.validateSecretKey(secretKey);
    if (!isValid) {
      return {
        status: 0,
        balance: 0,
        error: 'ACCESS_DENIED',
      };
    }

    return this.whitecliffCallbackService.getBalance(body);
  }

  @Post('/debit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '사용자 잔액 차감' })
  @ApiBody({ type: DebitRequestDto })
  @CasinoResponse(TransactionResponseDto, { description: '차감 성공' })
  @AuditLog(getWhitecliffAuditOptions('DEBIT'))
  async debit(
    @Headers('secret-key') secretKey: string,
    @Body() body: DebitRequestDto,
  ): Promise<TransactionResponseDto> {
    // 비밀키 검증
    const { isValid, currency } =
      this.whitecliffCallbackService.validateSecretKey(secretKey);
    if (!isValid) {
      return {
        status: 0,
        balance: 0,
        error: 'ACCESS_DENIED',
      };
    }

    // 서비스 호출
    return this.whitecliffCallbackService.debit(body);
  }

  @Post('/credit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '사용자 잔액 추가' })
  @ApiBody({ type: CreditRequestDto })
  @CasinoResponse(TransactionResponseDto, { description: '추가 성공' })
  @AuditLog(getWhitecliffAuditOptions('CREDIT'))
  async credit(
    @Headers('secret-key') secretKey: string,
    @Body() body: CreditRequestDto,
  ): Promise<TransactionResponseDto> {
    // 비밀키 검증
    const { isValid, currency } =
      this.whitecliffCallbackService.validateSecretKey(secretKey);
    if (!isValid) {
      return {
        status: 0,
        balance: 0,
        error: 'ACCESS_DENIED',
      };
    }

    // 서비스 호출
    return this.whitecliffCallbackService.credit(body);
  }

  @Post('/bonus')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '사용자 보너스 조회' })
  @CasinoResponse(GetBonusResponseDto, { description: '보너스 조회 성공' })
  @AuditLog(getWhitecliffAuditOptions('GET_BONUS'))
  async getBonus(
    @Headers('secret-key') secretKey: string,
    @Body() body: GetBonusRequestDto,
  ): Promise<GetBonusResponseDto> {
    // 비밀키 검증
    const { isValid, currency } =
      this.whitecliffCallbackService.validateSecretKey(secretKey);
    if (!isValid) {
      return {
        status: 0,
        balance: 0,
        error: 'ACCESS_DENIED',
      };
    }

    // 서비스 호출
    return this.whitecliffCallbackService.getBonus(body, currency);
  }
}
