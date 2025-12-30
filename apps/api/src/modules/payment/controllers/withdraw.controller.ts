// src/modules/payment/controllers/withdraw.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WithdrawService } from '../application/withdraw.service';
import { CreateWithdrawRequestDto } from '../dtos/create-withdraw-request.dto';
import { CreateWithdrawResponseDto } from '../dtos/create-withdraw-response.dto';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { RequestClientInfoParam } from 'src/common/auth/decorators/request-info.decorator';
import type { RequestClientInfo } from 'src/common/http/types';

@ApiTags('출금 (Withdraw)')
@Controller('withdraws')
@ApiBearerAuth()
export class WithdrawController {
  constructor(
    private readonly withdrawService: WithdrawService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '출금 요청' })
  @ApiResponse({
    status: 201,
    description: '출금 요청이 성공적으로 생성되었습니다.',
    type: CreateWithdrawResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청입니다.',
  })
  @ApiResponse({
    status: 401,
    description: '인증이 필요합니다.',
  })
  async createWithdraw(
    @Body() createWithdrawRequest: CreateWithdrawRequestDto,
    @CurrentUser() user: CurrentUserWithSession,
    @RequestClientInfoParam() clientInfo: RequestClientInfo,
  ): Promise<CreateWithdrawResponseDto> {
    try {
      // const result = await this.withdrawService.createWithdraw(
      //   user.id,
      //   createWithdrawRequest,
      // );

      // return result;
      return {
        amount: createWithdrawRequest.amount,
        currency: 'USDT',
        address: createWithdrawRequest.address,
      };
    } catch (error) {
      throw error;
    }
  }
}
