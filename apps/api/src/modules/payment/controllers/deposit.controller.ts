// src/modules/payment/controllers/deposit.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DepositService } from '../application/deposit.service';
import { CreateDepositResponseDto } from '../dtos/create-deposit-response.dto';
import { CreateDepositRequestDto } from '../dtos/create-deposit-request.dto';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { Inject } from '@nestjs/common';
import { RequestClientInfoParam } from 'src/common/auth/decorators/request-info.decorator';
import type { RequestClientInfo } from 'src/common/http/types';

@ApiTags('입금 (Deposit)')
@Controller('deposits')
@ApiBearerAuth()
export class DepositController {
  constructor(
    private readonly depositService: DepositService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '입금 요청' })
  @ApiResponse({
    status: 201,
    description: '입금 요청이 성공적으로 생성되었습니다.',
    type: CreateDepositResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청입니다.',
  })
  @ApiResponse({
    status: 401,
    description: '인증이 필요합니다.',
  })
  async createDeposit(
    @Body() createDepositRequest: CreateDepositRequestDto,
    @CurrentUser() user: CurrentUserWithSession,
    @RequestClientInfoParam() clientInfo: RequestClientInfo,
  ): Promise<CreateDepositResponseDto> {
    return await this.depositService.createDeposit(
      user.id,
      createDepositRequest,
      clientInfo,
    );
  }

  //   @Get(':invoiceId')
  //   @ApiOperation({ summary: '인보이스 상태 조회' })
  //   @ApiResponse({
  //     status: 200,
  //     description: '인보이스 상태가 조회되었습니다.',
  //   })
  //   async getInvoiceStatus(
  //     @RequesClienttInfo() clientInfo: RequestClientInfo,
  //     @CurrentUser() user: AccessTokenPayload,
  //     @Param('invoiceId') invoiceId: string,
  //   ) {
  //     try {
  //       const result = await this.depositService.getInvoiceStatus(
  //         invoiceId,
  //         user.sub,
  //       );

  //       // 성공 로그 기록
  //       await this.activityLog.logSuccess(
  //         {
  //           userId: user.sub,
  //           activityType: ActivityType.DEPOSIT_INVOICE_STATUS_CHECK,
  //           description: `인보이스 상태 조회 - ID: ${invoiceId}`,
  //           metadata: {
  //             invoiceId,
  //             status: result.status,
  //           },
  //         },
  //         clientInfo,
  //       );

  //       return result;
  //     } catch (error) {
  //       // 실패 로그 기록
  //       await this.activityLog.logFailure(
  //         {
  //           userId: user.sub,
  //           activityType: ActivityType.DEPOSIT_INVOICE_STATUS_CHECK,
  //           description: `인보이스 상태 조회 실패 - ID: ${invoiceId}`,
  //           metadata: {
  //             invoiceId,
  //             error: error.message,
  //           },
  //         },
  //         clientInfo,
  //       );
  //       throw error;
  //     }
  //   }

  //   @Get()
  //   @ApiOperation({ summary: '입금 내역 조회' })
  //   @ApiResponse({
  //     status: 200,
  //     description: '입금 내역이 조회되었습니다.',
  //   })
  //   async getDepositHistory(
  //     @RequesClienttInfo() clientInfo: RequestClientInfo,
  //     @CurrentUser() user: AccessTokenPayload,
  //     @Query('page') page?: number,
  //     @Query('limit') limit?: number,
  //   ) {
  //     try {
  //       const result = await this.depositService.getDepositHistory(
  //         user.sub,
  //         page,
  //         limit,
  //       );

  //       // 성공 로그 기록
  //       await this.activityLog.logSuccess(
  //         {
  //           userId: user.sub,
  //           activityType: ActivityType.DEPOSIT_HISTORY_VIEW,
  //           description: `입금 내역 조회 - 페이지: ${page || 1}, 제한: ${limit || 10}`,
  //           metadata: {
  //             page: page || 1,
  //             limit: limit || 10,
  //           },
  //         },
  //         clientInfo,
  //       );

  //       return result;
  //     } catch (error) {
  //       await this.activityLog.logFailure(
  //         {
  //           userId: user.sub,
  //           activityType: ActivityType.DEPOSIT_HISTORY_VIEW,
  //           description: `입금 내역 조회 실패 - 페이지: ${page || 1}, 제한: ${limit || 10}`,
  //           metadata: {
  //             page: page || 1,
  //             limit: limit || 10,
  //             error: error.message,
  //           },
  //         },
  //         clientInfo,
  //       );
  //       throw error;
  //     }
  //   }
}
