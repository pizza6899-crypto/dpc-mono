import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
  UseFilters,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { CasinoResponse } from '../../../../../common/http/decorators/casino-response.decorator';
import { GuestOnly } from 'src/common/auth/decorators/roles.decorator';
import { AuditLog } from '../../../../audit-log/infrastructure/audit-log.decorator';
import { getWhitecliffAuditOptions } from '../infrastructure/whitecliff-audit.util';
import { WhitecliffCallbackService } from '../application/whitecliff-callback.service';
import { CreditRequestDto, DebitRequestDto, BonusRequestDto, BonusResponseDto, GetWhitecliffBalanceRequestDto, GetWhitecliffBalanceResponseDto, TransactionResponseDto } from '../dtos';
import { WhitecliffExceptionFilter } from '../infrastructure/whitecliff-exception.filter';
import { WhitecliffValidationPipe } from '../infrastructure/whitecliff-validation.pipe';

@ApiTags('Public Casino Callback')
@Controller('dopaminedev')
@GuestOnly()
@UseFilters(WhitecliffExceptionFilter)
@UsePipes(new WhitecliffValidationPipe())
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
    return this.whitecliffCallbackService.getBalance(body, secretKey);
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
    return this.whitecliffCallbackService.debit(body, secretKey);
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
    return this.whitecliffCallbackService.credit(body, secretKey);
  }

  @Post('/bonus')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '사용자 보너스 지급' })
  @CasinoResponse(BonusResponseDto, { description: '보너스 지급 성공' })
  @AuditLog(getWhitecliffAuditOptions('GET_BONUS'))
  async bonus(
    @Headers('secret-key') secretKey: string,
    @Body() body: BonusRequestDto,
  ): Promise<BonusResponseDto> {
    return this.whitecliffCallbackService.bonus(body, secretKey);
  }
}
