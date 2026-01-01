import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseFilters,
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

@ApiTags('DC Callback(콜백)')
@Controller('dopaminedev')
@GuestOnly()
@UseFilters() // 글로벌 예외 필터 비활성화
export class DcCallbackController {
  // TODO: Service 의존성 주입 예정

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그인 콜백' })
  @ApiBody({ type: DcLoginRequestDto })
  @CasinoResponse(DcLoginResponseDto, { description: '로그인 성공' })
  async login(@Body() body: DcLoginRequestDto): Promise<DcLoginResponseDto> {
    // TODO: 로직 구현 예정
    throw new Error('Not implemented');
  }

  @Post('/wager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '베팅 콜백' })
  @ApiBody({ type: DcWagerRequestDto })
  @CasinoResponse(DcWagerResponseDto, { description: '베팅 성공' })
  async wager(@Body() body: DcWagerRequestDto): Promise<DcWagerResponseDto> {
    // TODO: 로직 구현 예정
    throw new Error('Not implemented');
  }

  @Post('/cancelWager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '베팅 취소 콜백' })
  @ApiBody({ type: DcCancelWagerRequestDto })
  @CasinoResponse(DcCancelWagerResponseDto, { description: '베팅 취소 성공' })
  async cancelWager(
    @Body() body: DcCancelWagerRequestDto,
  ): Promise<DcCancelWagerResponseDto> {
    // TODO: 로직 구현 예정
    throw new Error('Not implemented');
  }

  @Post('/appendWager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '추가 베팅 콜백' })
  @ApiBody({ type: DcAppendWagerRequestDto })
  @CasinoResponse(DcAppendWagerResponseDto, { description: '추가 베팅 성공' })
  async appendWager(
    @Body() body: DcAppendWagerRequestDto,
  ): Promise<DcAppendWagerResponseDto> {
    // TODO: 로직 구현 예정
    throw new Error('Not implemented');
  }

  @Post('/endWager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '베팅 종료 및 지급 콜백' })
  @ApiBody({ type: DcEndWagerRequestDto })
  @CasinoResponse(DcEndWagerResponseDto, { description: '베팅 종료 성공' })
  async endWager(
    @Body() body: DcEndWagerRequestDto,
  ): Promise<DcEndWagerResponseDto> {
    // TODO: 로직 구현 예정
    throw new Error('Not implemented');
  }

  @Post('/freeSpinResult')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '무료 스핀 결과 콜백' })
  @ApiBody({ type: DcFreeSpinResultRequestDto })
  @CasinoResponse(DcFreeSpinResultResponseDto, {
    description: '무료 스핀 결과 처리 성공',
  })
  async freeSpinResult(
    @Body() body: DcFreeSpinResultRequestDto,
  ): Promise<DcFreeSpinResultResponseDto> {
    // TODO: 로직 구현 예정
    throw new Error('Not implemented');
  }

  @Post('/getBalance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '잔액 조회 콜백' })
  @ApiBody({ type: GetDcBalanceRequestDto })
  @CasinoResponse(GetDcBalanceResponseDto, { description: '잔액 조회 성공' })
  async getBalance(
    @Body() body: GetDcBalanceRequestDto,
  ): Promise<GetDcBalanceResponseDto> {
    // TODO: 로직 구현 예정
    throw new Error('Not implemented');
  }

  @Post('/promoPayout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '프로모션 지급 콜백' })
  @ApiBody({ type: DcPromoPayoutRequestDto })
  @CasinoResponse(DcPromoPayoutResponseDto, { description: '프로모션 지급 성공' })
  async promoPayout(
    @Body() body: DcPromoPayoutRequestDto,
  ): Promise<DcPromoPayoutResponseDto> {
    // TODO: 로직 구현 예정
    throw new Error('Not implemented');
  }
}

