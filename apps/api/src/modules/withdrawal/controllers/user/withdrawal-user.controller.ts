import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
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
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/common/auth/decorators/current-user.decorator';
import { RequestClientInfoParam } from 'src/common/auth/decorators/request-info.decorator';
import { AuditLog } from 'src/modules/audit-log/infrastructure';
import { LogType } from 'src/modules/audit-log/domain';
import { ExchangeCurrencyCode } from '@prisma/client';
import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';
import {
  RequestCryptoWithdrawalService,
  RequestBankWithdrawalService,
  CancelWithdrawalService,
  FindWithdrawalsService,
  GetWithdrawalService,
  GetWithdrawalOptionsService,
} from '../../application';
import { WithdrawalDetail } from '../../domain';
import {
  RequestCryptoWithdrawalDto,
  RequestBankWithdrawalDto,
  GetWithdrawalsQueryDto,
  WithdrawalResponseDto,
  CreateWithdrawalResponseDto,
  CancelWithdrawalResponseDto,
  WithdrawalOptionsResponseDto,
} from './dto';

@ApiTags('User Withdrawal')
@Controller('withdrawals')
@ApiBearerAuth()
@ApiStandardErrors()
export class WithdrawalUserController {
  constructor(
    private readonly requestCryptoWithdrawalService: RequestCryptoWithdrawalService,
    private readonly requestBankWithdrawalService: RequestBankWithdrawalService,
    private readonly cancelWithdrawalService: CancelWithdrawalService,
    private readonly findWithdrawalsService: FindWithdrawalsService,
    private readonly getWithdrawalService: GetWithdrawalService,
    private readonly getWithdrawalOptionsService: GetWithdrawalOptionsService,
    private readonly sqidsService: SqidsService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Paginated()
  @ApiOperation({
    summary: 'Get my withdrawal list / 내 출금 목록 조회',
    description:
      '현재 로그인한 사용자의 출금 신청 내역을 페이징하여 조회합니다.',
  })
  @ApiPaginatedResponse(WithdrawalResponseDto, {
    status: 200,
    description: 'Successfully retrieved withdrawal list',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_MY_WITHDRAWAL_LIST',
    category: 'WITHDRAWAL',
    extractMetadata: (user, args) => ({
      userId: user.id,
      status: args[0]?.status,
      methodType: args[0]?.methodType,
      page: args[0]?.page,
    }),
  })
  async getMyWithdrawals(
    @Query() query: GetWithdrawalsQueryDto,
    @CurrentUser() user: CurrentUserWithSession,
  ): Promise<PaginatedData<WithdrawalResponseDto>> {
    const page = query.page!;
    const limit = query.limit!;
    const offset = (page - 1) * limit;

    const result = await this.findWithdrawalsService.execute({
      userId: user.id,
      status: query.status,
      methodType: query.methodType,
      limit,
      offset,
    });

    return {
      data: result.withdrawals.map((item) => this.toResponseDto(item)),
      total: result.total,
      page,
      limit,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get withdrawal detail / 출금 상세 조회',
    description: '특정 출금 신청 건의 상세 정보를 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: 'Withdrawal ID',
    type: String,
  })
  @ApiStandardResponse(WithdrawalResponseDto, {
    status: 200,
    description: 'Withdrawal detail retrieved successfully',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_WITHDRAWAL_DETAIL',
    category: 'WITHDRAWAL',
    extractMetadata: (_, args) => ({
      withdrawalId: args[0],
    }),
  })
  async getWithdrawalDetail(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserWithSession,
  ): Promise<WithdrawalResponseDto> {
    const decodedId = this.sqidsService.decode(id, SqidsPrefix.WITHDRAWAL);
    const withdrawal = await this.getWithdrawalService.execute({
      userId: user.id,
      withdrawalId: decodedId,
    });
    return this.toResponseDto(withdrawal);
  }

  @Post('crypto')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Request crypto withdrawal / 암호화폐 출금 신청',
    description: '암호화폐(USDT 등)로 출급을 신청합니다.',
  })
  @ApiStandardResponse(CreateWithdrawalResponseDto, {
    status: 201,
    description: 'Crypto withdrawal request created successfully',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'CREATE_CRYPTO_WITHDRAWAL_REQUEST',
    category: 'WITHDRAWAL',
    extractMetadata: (_, args) => ({
      symbol: args[0]?.symbol,
      network: args[0]?.network,
      amount: args[0]?.amount,
    }),
  })
  async requestCryptoWithdrawal(
    @Body() dto: RequestCryptoWithdrawalDto,
    @CurrentUser() user: CurrentUserWithSession,
    @RequestClientInfoParam() clientInfo: RequestClientInfo,
  ): Promise<CreateWithdrawalResponseDto> {
    const result = await this.requestCryptoWithdrawalService.execute({
      userId: user.id,
      currency: dto.symbol as ExchangeCurrencyCode,
      amount: dto.amount,
      symbol: dto.symbol,
      network: dto.network,
      walletAddress: dto.walletAddress,
      walletAddressExtraId: dto.walletAddressExtraId,
      ipAddress: clientInfo.ip,
      deviceFingerprint: clientInfo.userAgent,
    });

    return {
      withdrawalId: this.sqidsService.encode(
        result.withdrawalId,
        SqidsPrefix.WITHDRAWAL,
      ),
      status: result.status,
      processingMode: result.processingMode,
      requestedAmount: result.requestedAmount,
      feeAmount: result.feeAmount ?? undefined,
      netAmount: result.netAmount,
    };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel withdrawal request / 출금 신청 취소',
    description: '대기 중인 출금 신청을 취소합니다.',
  })
  @ApiParam({
    name: 'id',
    description: 'Withdrawal ID',
    type: String,
  })
  @ApiStandardResponse(CancelWithdrawalResponseDto, {
    status: 200,
    description: 'Withdrawal request cancelled successfully',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'CANCEL_WITHDRAWAL_REQUEST',
    category: 'WITHDRAWAL',
    extractMetadata: (_, args) => ({
      withdrawalId: args[0],
    }),
  })
  async cancelWithdrawal(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserWithSession,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<CancelWithdrawalResponseDto> {
    const decodedId = this.sqidsService.decode(id, SqidsPrefix.WITHDRAWAL);
    const result = await this.cancelWithdrawalService.execute({
      userId: user.id,
      withdrawalId: decodedId,
    });

    return {
      withdrawalId: this.sqidsService.encode(
        result.withdrawalId,
        SqidsPrefix.WITHDRAWAL,
      ),
      status: result.status,
      cancelledAt: result.cancelledAt,
    };
  }

  @Post('bank')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Request bank withdrawal / 계좌 출금 신청',
    description: '은행 계좌 송금을 통한 출금을 신청합니다.',
  })
  @ApiStandardResponse(CreateWithdrawalResponseDto, {
    status: 201,
    description: 'Bank withdrawal request created successfully',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'CREATE_BANK_WITHDRAWAL_REQUEST',
    category: 'WITHDRAWAL',
    extractMetadata: (_, args) => ({
      bankConfigId: args[0]?.bankConfigId,
      amount: args[0]?.amount,
      bankName: args[0]?.bankName,
    }),
  })
  async requestBankWithdrawal(
    @Body() dto: RequestBankWithdrawalDto,
    @CurrentUser() user: CurrentUserWithSession,
    @RequestClientInfoParam() clientInfo: RequestClientInfo,
  ): Promise<CreateWithdrawalResponseDto> {
    const decodedBankConfigId = this.sqidsService.decode(
      dto.bankConfigId,
      SqidsPrefix.WITHDRAW_BANK_CONFIG,
    );
    const result = await this.requestBankWithdrawalService.execute({
      userId: user.id,
      currency: ExchangeCurrencyCode.KRW, // TODO: Config에서 currency 가져오기
      amount: dto.amount,
      bankConfigId: decodedBankConfigId,
      bankName: dto.bankName,
      accountNumber: dto.accountNumber,
      accountHolder: dto.accountHolder,
      ipAddress: clientInfo.ip,
      deviceFingerprint: clientInfo.userAgent,
    });

    return {
      withdrawalId: this.sqidsService.encode(
        result.withdrawalId,
        SqidsPrefix.WITHDRAWAL,
      ),
      status: result.status,
      processingMode: result.processingMode,
      requestedAmount: result.requestedAmount,
      feeAmount: result.feeAmount ?? undefined,
      netAmount: result.netAmount,
    };
  }

  @Get('options')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get withdrawal options / 출금 옵션 조회',
    description:
      '사용 가능한 출금 수단(암호화폐, 은행) 및 관련 설정을 조회합니다.',
  })
  @ApiStandardResponse(WithdrawalOptionsResponseDto, {
    status: 200,
    description: 'Withdrawal options retrieved successfully',
  })
  @AuditLog({
    type: LogType.ACTIVITY,
    action: 'VIEW_WITHDRAWAL_OPTIONS',
    category: 'WITHDRAWAL',
  })
  async getWithdrawalOptions(): Promise<WithdrawalOptionsResponseDto> {
    const { crypto, bank } = await this.getWithdrawalOptionsService.execute();

    return {
      crypto: crypto.map((config) => ({
        id: this.sqidsService.encode(
          config.id,
          SqidsPrefix.WITHDRAW_CRYPTO_CONFIG,
        ),
        symbol: config.symbol,
        network: config.network,
        minAmount: config.minWithdrawAmount.toString(),
        maxAmount: config.maxWithdrawAmount?.toString() ?? null,
        feeFixed: config.props.withdrawFeeFixed.toString(),
        feeRate: config.props.withdrawFeeRate.toString(),
      })),
      bank: bank.map((config) => ({
        id: this.sqidsService.encode(
          config.id,
          SqidsPrefix.WITHDRAW_BANK_CONFIG,
        ),
        currency: config.currency,
        bankName: config.bankName,
        minAmount: config.minWithdrawAmount.toString(),
        maxAmount: config.maxWithdrawAmount?.toString() ?? null,
        feeFixed: config.props.withdrawFeeFixed.toString(),
        feeRate: config.props.withdrawFeeRate.toString(),
      })),
    };
  }

  private toResponseDto(withdrawal: WithdrawalDetail): WithdrawalResponseDto {
    return {
      id: this.sqidsService.encode(withdrawal.id, SqidsPrefix.WITHDRAWAL),
      status: withdrawal.status,
      methodType: withdrawal.methodType,
      processingMode: withdrawal.processingMode,
      currency: withdrawal.currency,
      requestedAmount: withdrawal.requestedAmount.toString(),
      feeAmount: withdrawal.props.feeAmount?.toString(),
      netAmount: withdrawal.props.netAmount?.toString(),
      network: withdrawal.props.network ?? undefined,
      walletAddress: withdrawal.props.walletAddress ?? undefined,
      transactionHash: withdrawal.props.transactionHash ?? undefined,
      failureReason: withdrawal.props.failureReason ?? undefined,
      createdAt: withdrawal.props.createdAt,
      confirmedAt: withdrawal.props.confirmedAt ?? undefined,
      cancelledAt: withdrawal.props.cancelledAt ?? undefined,
    };
  }
}
