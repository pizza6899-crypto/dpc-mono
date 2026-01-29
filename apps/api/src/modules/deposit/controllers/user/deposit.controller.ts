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
  ApiBearerAuth,
  ApiParam,
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
import { CreateBankDepositRequestDto } from './dto/request/create-bank-deposit-request.dto';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { RequestClientInfoParam } from 'src/common/auth/decorators/request-info.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { GetAvailableDepositMethodsService } from '../../application/get-available-deposit-methods.service';
import { CreateCryptoDepositService } from '../../application/create-crypto-deposit.service';
import { CreateBankDepositService } from '../../application/create-bank-deposit.service';
import { GetMyDepositsService } from '../../application/get-my-deposits.service';
import { GetMyDepositDetailService } from '../../application/get-my-deposit-detail.service';
import { CancelDepositService } from '../../application/cancel-deposit.service';
import {
  UserDepositResponseDto,
  CancelDepositResponseDto,
} from './dto/response/deposit.response.dto';
import { GetAvailableDepositMethodsResponseDto } from './dto/response/deposit-methods.response.dto';
import { GetDepositsQueryDto } from './dto/request/get-deposits-query.dto';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import { DepositDetail } from '../../domain';

@ApiTags('User Deposit')
@Controller('deposits')
@ApiBearerAuth()
@ApiStandardErrors()
export class DepositController {
  constructor(
    private readonly getAvailableMethodsService: GetAvailableDepositMethodsService,
    private readonly createCryptoDepositService: CreateCryptoDepositService,
    private readonly createBankDepositService: CreateBankDepositService,
    private readonly getMyDepositsService: GetMyDepositsService,
    private readonly getMyDepositDetailService: GetMyDepositDetailService,
    private readonly cancelDepositService: CancelDepositService,
    private readonly sqidsService: SqidsService,
  ) { }

  // ============================================
  // 입금 수단 조회
  // ============================================

  @Get('methods')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get available deposit methods / 사용 가능한 입금 수단 조회',
    description:
      'Retrieve list of available deposit methods (crypto, bank transfer). (사용 가능한 입금 수단 목록을 조회합니다.)',
  })
  @ApiStandardResponse(GetAvailableDepositMethodsResponseDto, {
    status: 200,
    description: 'Deposit methods retrieved successfully / 입금 수단 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_DEPOSIT_METHODS',
    category: 'DEPOSIT',
  })
  async getAvailableMethods(
    @CurrentUser() user: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<GetAvailableDepositMethodsResponseDto> {
    return this.getAvailableMethodsService.execute();
  }

  // ============================================
  // 입금 관리
  // ============================================

  @Get()
  @HttpCode(HttpStatus.OK)
  @Paginated()
  @ApiOperation({
    summary: 'Get my deposit list / 내 입금 목록 조회',
    description:
      'Retrieve my deposit history with pagination. (내 입금 내역을 페이징하여 조회합니다.)',
  })
  @ApiPaginatedResponse(UserDepositResponseDto, {
    status: 200,
    description: 'Deposit list retrieved successfully / 입금 목록 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_MY_DEPOSIT_LIST',
    category: 'DEPOSIT',
  })
  async getMyDeposits(
    @Query() query: GetDepositsQueryDto,
    @CurrentUser() user: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
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
      data: result.data.map(deposit => this.toResponseDto(deposit)),
      page: result.page,
      limit: result.limit,
      total: result.total,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get deposit detail / 입금 상세 조회',
    description:
      'Retrieve detailed information of a specific deposit. (특정 입금의 상세 정보를 조회합니다.)',
  })
  @ApiParam({
    name: 'id',
    description: 'Deposit ID / 입금 ID',
    type: String,
  })
  @ApiStandardResponse(UserDepositResponseDto, {
    status: 200,
    description: 'Deposit detail retrieved successfully / 입금 상세 조회 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_DEPOSIT_DETAIL',
    category: 'DEPOSIT',
    extractMetadata: (_, args) => ({
      depositId: args[0],
    }),
  })
  async getDepositDetail(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<UserDepositResponseDto> {
    const decodedId = this.sqidsService.decode(id, SqidsPrefix.DEPOSIT);
    const deposit = await this.getMyDepositDetailService.execute({
      id: decodedId,
      userId: user.id,
    });
    return this.toResponseDto(deposit);
  }

  @Post('crypto')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create crypto deposit request / 암호화폐 입금 요청 생성',
    description:
      'Create a new cryptocurrency deposit request. (새로운 암호화폐 입금 요청을 생성합니다.)',
  })
  @ApiStandardResponse(CreateDepositResponseDto, {
    status: 201,
    description: 'Crypto deposit request created successfully / 암호화폐 입금 요청 생성 성공',
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
    @CurrentUser() user: CurrentUserWithSession,
    @RequestClientInfoParam() clientInfo: RequestClientInfo,
  ): Promise<CreateDepositResponseDto> {
    const deposit = await this.createCryptoDepositService.execute({
      ...dto,
      userId: user.id,
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

  @Post('bank')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create bank deposit request / 무통장 입금 요청 생성',
    description:
      'Create a new bank transfer deposit request. (새로운 무통장 입금 요청을 생성합니다.)',
  })
  @ApiStandardResponse(CreateDepositResponseDto, {
    status: 201,
    description: 'Bank deposit request created successfully / 무통장 입금 요청 생성 성공',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'CREATE_BANK_DEPOSIT_REQUEST',
    category: 'DEPOSIT',
    extractMetadata: (_, args) => ({
      currency: args[0]?.payCurrency,
      amount: args[0]?.amount,
    }),
  })
  async createBankDeposit(
    @Body() dto: CreateBankDepositRequestDto,
    @CurrentUser() user: CurrentUserWithSession,
    @RequestClientInfoParam() clientInfo: RequestClientInfo,
  ): Promise<CreateDepositResponseDto> {
    const result = await this.createBankDepositService.execute({
      ...dto,
      userId: user.id,
      ipAddress: clientInfo.ip,
      deviceFingerprint: clientInfo.userAgent,
    });
    return {
      id: this.sqidsService.encode(result.deposit.id!, SqidsPrefix.DEPOSIT),
      payCurrency: result.deposit.depositCurrency,
      bankName: result.selectedBank.bankName,
      accountNumber: result.selectedBank.accountNumber,
      accountHolder: result.selectedBank.accountHolder,
      transactionId: result.deposit.transactionId?.toString(),
      isDuplicate: false,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel deposit request / 입금 신청 취소',
    description:
      'Cancel a pending deposit request. (대기 중인 입금 요청을 취소합니다.)',
  })
  @ApiParam({
    name: 'id',
    description: 'DepositDetail ID (Encoded) / 인코딩된 입금 상세 ID',
    type: String,
  })
  @ApiStandardResponse(CancelDepositResponseDto, {
    status: 200,
    description: 'Deposit request cancelled successfully / 입금 신청 취소 성공',
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
    @CurrentUser() user: CurrentUserWithSession,
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
      bankName: deposit.bankName ?? null,
      createdAt: deposit.createdAt,
      confirmedAt: deposit.confirmedAt ?? null,
      failedAt: deposit.failedAt ?? null,
      failureReason: deposit.failureReason ?? null,
    };
  }
}
