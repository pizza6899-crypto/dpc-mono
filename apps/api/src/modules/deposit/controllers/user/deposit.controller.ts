// src/modules/deposit/controllers/user/deposit.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiCookieAuth,
} from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
  ApiPaginatedResponse,
} from 'src/common/http/decorators/api-response.decorator';
import { Paginated } from 'src/common/http/decorators/paginated.decorator';
import type { PaginatedData, RequestClientInfo } from 'src/common/http/types';
import { CreateDepositResponseDto } from './dto/response/create-deposit-response.dto';
import { CreateCryptoDepositRequestDto } from './dto/request/create-crypto-deposit-request.dto';
import { CreateFiatDepositRequestDto } from './dto/request/create-fiat-deposit-request.dto';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { RequestClientInfoParam } from 'src/common/auth/decorators/request-info.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { CreateCryptoDepositService } from '../../application/create-crypto-deposit.service';
import { CreateFiatDepositService } from '../../application/create-fiat-deposit.service';
import { GetMyDepositsService } from '../../application/get-my-deposits.service';
import { CancelDepositService } from '../../application/cancel-deposit.service';
import {
  UserDepositResponseDto,
  CancelDepositResponseDto,
} from './dto/response/deposit.response.dto';
import { GetDepositsQueryDto } from './dto/request/get-deposits-query.dto';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { DepositDetail } from '../../domain';

@ApiTags('User Deposit')
@Controller('deposits')
@ApiCookieAuth()
@ApiStandardErrors()
export class DepositController {
  constructor(
    private readonly createCryptoDepositService: CreateCryptoDepositService,
    private readonly createFiatDepositService: CreateFiatDepositService,
    private readonly getMyDepositsService: GetMyDepositsService,
    private readonly cancelDepositService: CancelDepositService,
    private readonly sqidsService: SqidsService,
  ) { }

  // ============================================
  // 입금 관리
  // ============================================

  @Get()
  @HttpCode(HttpStatus.OK)
  @Paginated()
  @ApiOperation({
    summary: '내 입금 목록 조회 / Get my deposit list',
    description:
      '내 입금 내역을 페이징하여 조회합니다. / Retrieve my deposit history with pagination.',
  })
  @ApiPaginatedResponse(UserDepositResponseDto, {
    status: 200,
    description: '입금 목록 조회 성공 / Deposit list retrieved successfully',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_MY_DEPOSIT_LIST',
    category: 'DEPOSIT',
  })
  async getMyDeposits(
    @Query() query: GetDepositsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedData<UserDepositResponseDto>> {
    const result = await this.getMyDepositsService.execute({
      query: {
        skip: ((query.page || 1) - 1) * (query.limit || 20),
        take: query.limit || 20,
        status: query.status,
        methodType: query.methodType,
        currency: query.currency,
        startDate: query.startDate,
        endDate: query.endDate,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
      userId: user.id,
    });
    return {
      data: result.data.map((deposit) => this.toResponseDto(deposit)),
      page: result.page,
      limit: result.limit,
      total: result.total,
    };
  }

  @Post('crypto')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '암호화폐 입금 요청 생성 / Create crypto deposit request',
    description:
      '새로운 암호화폐 입금 요청을 생성합니다. / Create a new cryptocurrency deposit request.',
  })
  @ApiStandardResponse(CreateDepositResponseDto, {
    status: 201,
    description:
      '암호화폐 입금 요청 생성 성공 / Crypto deposit request created successfully',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'CREATE_CRYPTO_DEPOSIT_REQUEST',
    category: 'DEPOSIT',
    extractMetadata: (_, args) => ({
      currency: args[0]?.payCurrency,
      network: args[0]?.payNetwork,
    }),
  })
  async createCryptoDeposit(
    @Body() dto: CreateCryptoDepositRequestDto,
    @CurrentUser() user: AuthenticatedUser,
    @RequestClientInfoParam() clientInfo: RequestClientInfo,
  ): Promise<CreateDepositResponseDto> {
    const deposit = await this.createCryptoDepositService.execute({
      ...dto,
      user: user,
      ipAddress: clientInfo.ip,
      deviceFingerprint: clientInfo.userAgent,
    });
    return {
      id: this.sqidsService.encode(deposit.id!, SqidsPrefix.DEPOSIT),
      payAddress: deposit.walletAddress ?? undefined,
      payCurrency: deposit.depositCurrency,
      payNetwork: deposit.depositNetwork ?? undefined,
      payAddressExtraId: deposit.walletAddressExtraId,
      transactionId: deposit.transactionId?.toString(),
      isDuplicate: false,
    };
  }

  @Post('fiat')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '피아트 입금 요청 생성 / Create fiat deposit request',
    description:
      '새로운 피아트 입금 요청을 생성합니다. / Create a new fiat transfer deposit request.',
  })
  @ApiStandardResponse(CreateDepositResponseDto, {
    status: 201,
    description:
      '피아트 입금 요청 생성 성공 / Fiat deposit request created successfully',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'CREATE_FIAT_DEPOSIT_REQUEST',
    category: 'DEPOSIT',
    extractMetadata: (_, args) => ({
      currency: args[0]?.payCurrency,
      amount: args[0]?.amount,
    }),
  })
  async createFiatDeposit(
    @Body() dto: CreateFiatDepositRequestDto,
    @CurrentUser() user: AuthenticatedUser,
    @RequestClientInfoParam() clientInfo: RequestClientInfo,
  ): Promise<CreateDepositResponseDto> {
    const result = await this.createFiatDepositService.execute({
      ...dto,
      user: user,
      ipAddress: clientInfo.ip,
      deviceFingerprint: clientInfo.userAgent,
    });
    return {
      id: this.sqidsService.encode(result.deposit.id!, SqidsPrefix.DEPOSIT),
      payCurrency: result.deposit.depositCurrency,
      transactionId: result.deposit.transactionId?.toString(),
      isDuplicate: false,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '입금 신청 취소 / Cancel deposit request',
    description:
      '대기 중인 입금 요청을 취소합니다. / Cancel a pending deposit request.',
  })
  @ApiParam({
    name: 'id',
    description: '인코딩된 입금 상세 ID / DepositDetail ID (Encoded)',
    type: String,
  })
  @ApiStandardResponse(CancelDepositResponseDto, {
    status: 200,
    description: '입금 신청 취소 성공 / Deposit request cancelled successfully',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'CANCEL_DEPOSIT_REQUEST',
    category: 'DEPOSIT',
    extractMetadata: (_, args) => ({
      depositId: args[0],
    }),
  })
  async cancelDeposit(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<CancelDepositResponseDto> {
    const decodedId = this.sqidsService.decode(id, SqidsPrefix.DEPOSIT);

    await this.cancelDepositService.execute({
      id: decodedId,
      userId: user.id,
    });

    return { success: true };
  }

  private toResponseDto(deposit: DepositDetail): UserDepositResponseDto {
    const amount = deposit.getAmount();
    return {
      id: this.sqidsService.encode(deposit.id!, SqidsPrefix.DEPOSIT),
      status: deposit.status,
      methodType: deposit.getMethod().methodType,
      provider: deposit.getMethod().provider as any,
      requestedAmount: amount.requestedAmount.toString(),
      actuallyPaid: amount.actuallyPaid?.toString() ?? null,
      feeAmount: amount.feeAmount?.toString() ?? null,
      depositCurrency: deposit.depositCurrency,
      walletAddress: deposit.walletAddress,
      depositNetwork: deposit.depositNetwork,
      createdAt: deposit.createdAt,
      confirmedAt: deposit.confirmedAt ?? null,
      failedAt: deposit.failedAt ?? null,
      failureReason: deposit.failureReason ?? null,
    };
  }
}
