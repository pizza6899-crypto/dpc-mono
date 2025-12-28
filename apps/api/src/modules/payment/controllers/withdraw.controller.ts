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
import { CurrentUser } from 'src/platform/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/platform/auth/decorators/current-user.decorator';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { ActivityType } from 'src/platform/activity-log/activity-log.types';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import { Inject } from '@nestjs/common';
import { RequestClientInfoParam } from 'src/platform/auth/decorators/request-info.decorator';
import type { RequestClientInfo } from 'src/platform/http/types';

@ApiTags('출금 (Withdraw)')
@Controller('withdraws')
@ApiBearerAuth()
export class WithdrawController {
  constructor(
    private readonly withdrawService: WithdrawService,
    @Inject(ACTIVITY_LOG)
    private readonly activityLog: ActivityLogPort,
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

      // 성공 로그 기록
      await this.activityLog.logSuccess(
        {
          userId: user.id,
          activityType: ActivityType.WITHDRAW_REQUEST,
          description: `출금 요청 생성 - 금액: ${createWithdrawRequest.amount}, 통화: ${createWithdrawRequest.cryptoCurrency}`,
          metadata: {
            amount: createWithdrawRequest.amount,
            cryptoCurrency: createWithdrawRequest.cryptoCurrency,
            address: createWithdrawRequest.address,
          },
        },
        clientInfo,
      );

      // return result;
      return {
        amount: createWithdrawRequest.amount,
        currency: 'USDT',
        address: createWithdrawRequest.address,
      };
    } catch (error) {
      // 실패 로그 기록
      await this.activityLog.logFailure(
        {
          userId: user.id,
          activityType: ActivityType.WITHDRAW_REQUEST,
          description: `출금 요청 실패 - 금액: ${createWithdrawRequest.amount}, 통화: ${createWithdrawRequest.cryptoCurrency}`,
          metadata: {
            amount: createWithdrawRequest.amount,
            cryptoCurrency: createWithdrawRequest.cryptoCurrency,
            address: createWithdrawRequest.address,
            error: error.message,
          },
        },
        clientInfo,
      );
      throw error;
    }
  }
}
