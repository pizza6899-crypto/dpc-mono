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

// DTO는 별도 파일로 분리 예정
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
} from '../../../../casino/dcs/dtos/callback.dto';

@ApiTags('DC Callback(콜백)')
@Controller('dc')
@GuestOnly()
@UseFilters() // 글로벌 예외 필터 비활성화
export class DcCallbackController {
  // TODO: Service 의존성 주입 예정

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그인 콜백' })
  @ApiBody({ type: LoginRequestDto })
  @CasinoResponse(DcsLoginResponseDto, { description: '로그인 성공' })
  async login(@Body() body: LoginRequestDto): Promise<DcsLoginResponseDto> {
    // TODO: 로직 구현 예정
    throw new Error('Not implemented');
  }

  @Post('/wager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '베팅 콜백' })
  @ApiBody({ type: WagerRequestDto })
  @CasinoResponse(WagerResponseDto, { description: '베팅 성공' })
  async wager(@Body() body: WagerRequestDto): Promise<WagerResponseDto> {
    // TODO: 로직 구현 예정
    throw new Error('Not implemented');
  }

  @Post('/cancelWager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '베팅 취소 콜백' })
  @ApiBody({ type: CancelWagerRequestDto })
  @CasinoResponse(CancelWagerResponseDto, { description: '베팅 취소 성공' })
  async cancelWager(
    @Body() body: CancelWagerRequestDto,
  ): Promise<CancelWagerResponseDto> {
    // TODO: 로직 구현 예정
    throw new Error('Not implemented');
  }

  @Post('/appendWager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '추가 베팅 콜백' })
  @ApiBody({ type: AppendWagerRequestDto })
  @CasinoResponse(AppendWagerResponseDto, { description: '추가 베팅 성공' })
  async appendWager(
    @Body() body: AppendWagerRequestDto,
  ): Promise<AppendWagerResponseDto> {
    // TODO: 로직 구현 예정
    throw new Error('Not implemented');
  }

  @Post('/endWager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '베팅 종료 및 지급 콜백' })
  @ApiBody({ type: EndWagerRequestDto })
  @CasinoResponse(EndWagerResponseDto, { description: '베팅 종료 성공' })
  async endWager(
    @Body() body: EndWagerRequestDto,
  ): Promise<EndWagerResponseDto> {
    // TODO: 로직 구현 예정
    throw new Error('Not implemented');
  }

  @Post('/freeSpinResult')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '무료 스핀 결과 콜백' })
  @ApiBody({ type: FreeSpinResultRequestDto })
  @CasinoResponse(FreeSpinResultResponseDto, {
    description: '무료 스핀 결과 처리 성공',
  })
  async freeSpinResult(
    @Body() body: FreeSpinResultRequestDto,
  ): Promise<FreeSpinResultResponseDto> {
    // TODO: 로직 구현 예정
    throw new Error('Not implemented');
  }

  @Post('/getBalance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '잔액 조회 콜백' })
  @ApiBody({ type: GetDcsBalanceRequestDto })
  @CasinoResponse(GetDcsBalanceResponseDto, { description: '잔액 조회 성공' })
  async getBalance(
    @Body() body: GetDcsBalanceRequestDto,
  ): Promise<GetDcsBalanceResponseDto> {
    // TODO: 로직 구현 예정
    throw new Error('Not implemented');
  }

  @Post('/promoPayout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '프로모션 지급 콜백' })
  @ApiBody({ type: PromoPayoutRequestDto })
  @CasinoResponse(PromoPayoutResponseDto, { description: '프로모션 지급 성공' })
  async promoPayout(
    @Body() body: PromoPayoutRequestDto,
  ): Promise<PromoPayoutResponseDto> {
    // TODO: 로직 구현 예정
    throw new Error('Not implemented');
  }
}

